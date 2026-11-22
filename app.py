#!/usr/bin/env python3
"""Spice: a loopback-only local music library. Python 3.10+, optional FFmpeg."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import hashlib
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import shutil
import signal
import sqlite3
import subprocess
import threading
import time
from urllib.parse import parse_qs, urlsplit
import webbrowser
from lyrics import parse_lyrics, MAX_BYTES

BASE = Path(__file__).resolve().parent
EXTENSIONS = {'.mp3', '.flac', '.wav', '.ogg', '.opus', '.m4a', '.aac', '.aiff', '.aif', '.wma', '.ape', '.mp4', '.oga'}
COVER_NAMES = {'cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'front.jpg', 'front.png', 'album.jpg', 'album.png', 'cover.webp'}

class Library:
    def __init__(self, data_dir):
        self.root = Path(data_dir).expanduser().resolve()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.cache = self.root / 'cache'
        self.cache.mkdir(exist_ok=True)
        self.lock = threading.RLock()
        self.scanning = False
        self.progress = {'done': 0, 'total': 0, 'errors': 0}
        self.scan_error = None
        self.token = secrets.token_urlsafe(32)
        with self.db() as db:
            db.execute('CREATE TABLE IF NOT EXISTS tracks (id TEXT PRIMARY KEY, path TEXT UNIQUE, stamp TEXT, metadata TEXT)')
            db.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)')
        self.state = self.read_setting('state', {'liked': [], 'playlists': [], 'recent': [], 'theme': 'spice', 'volume': .7})
        self.folders = self.read_setting('folders', [])

    @contextmanager
    def db(self):
        connection = sqlite3.connect(self.root / 'library.sqlite3', timeout=30)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def read_setting(self, key, default):
        with self.db() as db:
            row = db.execute('SELECT value FROM settings WHERE key=?', (key,)).fetchone()
        return json.loads(row[0]) if row else default

    def write_setting(self, key, value):
        with self.db() as db:
            db.execute('INSERT OR REPLACE INTO settings VALUES (?,?)', (key, json.dumps(value)))

    def tracks(self):
        with self.db() as db:
            rows = db.execute('SELECT metadata FROM tracks').fetchall()
        return sorted((json.loads(r[0]) for r in rows), key=lambda t: (t['artist'].casefold(), t['album'].casefold(), t['disc'], t['number'], t['title'].casefold()))

    def track_path(self, track_id):
        with self.db() as db:
            row = db.execute('SELECT path FROM tracks WHERE id=?', (track_id,)).fetchone()
        if not row:
            raise FileNotFoundError('This track is no longer in your library.')
        p = Path(row[0]).resolve()
        if not any(p.is_relative_to(Path(f).resolve()) for f in self.folders):
            raise FileNotFoundError('Track is outside your music folders.')
        if not p.is_file():
            raise FileNotFoundError('The music file has moved or its drive is disconnected. Rescan your library.')
        return p

    def lyrics(self, track_id, imported=None):
        path = self.track_path(track_id)
        with self.db() as db:
            duration = json.loads(db.execute('SELECT metadata FROM tracks WHERE id=?', (track_id,)).fetchone()[0]).get('duration', 0)
        key = 'lyrics:' + track_id
        if imported is not None and imported.get('reset') is True:
            with self.db() as db:
                db.execute('DELETE FROM settings WHERE key=?', (key,))
            return self.lyrics(track_id)
        if imported is not None:
            name = Path(str(imported.get('filename', ''))).name
            parsed = parse_lyrics(imported.get('text'), name, duration)
            self.write_setting(key, parsed)
            return parsed
        saved = self.read_setting(key, None)
        if saved:
            return saved
        # A song folder owns its lyrics: no filename match is required when it
        # contains exactly one audio file. Shared album folders still require
        # matching names so one song cannot borrow another song's lyrics.
        formats = ('.ttml', '.lrc', '.txt')
        files = [f for f in path.parent.iterdir()
                 if f.is_file() and f.resolve().parent == path.parent]
        lyrics = [f for f in files if f.suffix.lower() in formats]
        candidates = sorted((f for f in lyrics if f.stem.casefold() == path.stem.casefold()),
                            key=lambda f: (formats.index(f.suffix.lower()), f.name))
        if not candidates and sum(f.suffix.lower() in EXTENSIONS for f in files) == 1:
            for extension in formats:
                choices = [f for f in lyrics if f.suffix.lower() == extension]
                if len(choices) > 1:
                    raise ValueError('Multiple lyric files in this song folder. '
                                     'Give the preferred file the same name as the audio '
                                     '(before the extension), or select it with Add lyrics.')
                if choices:
                    candidates = choices
                    break
        for f in candidates:
            if f.resolve().parent != path.parent:
                continue
            if f.stat().st_size > MAX_BYTES:
                raise ValueError('The lyric file is larger than 1 MB.')
            return parse_lyrics(f.read_text(encoding='utf-8-sig', errors='replace'), f.name, duration)
        return {'lines': [], 'timing': None, 'source': None}

    def begin_scan(self, folders=None):
        with self.lock:
            if self.scanning:
                raise ValueError('A library scan is already running.')
            if folders is not None:
                valid = []
                for f in folders:
                    p = Path(f).expanduser().resolve()
                    if not p.is_dir():
                        raise ValueError(f'Folder not found: {f}')
                    if str(p) not in valid:
                        valid.append(str(p))
                self.folders = valid
                self.write_setting('folders', valid)
            self.scanning = True
            self.scan_error = None
            self.progress = {'done': 0, 'total': 0, 'errors': 0}
        threading.Thread(target=self.scan, daemon=True).start()

    def metadata(self, path, old):
        st = path.stat()
        stamp = f'{st.st_mtime_ns}:{st.st_size}'
        key = hashlib.sha256(os.fsencode(str(path))).hexdigest()[:24]
        if old and old[0] == stamp:
            return key, str(path), stamp, old[1]
        tags, duration, codec, bitrate, sample_rate = {}, 0, '', 0, 0
        if shutil.which('ffprobe'):
            try:
                result = subprocess.run(['ffprobe', '-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', str(path)], capture_output=True, timeout=15, check=True)
                probe = json.loads(result.stdout)
                fmt = probe.get('format', {})
                tags = {k.lower(): str(v) for k, v in fmt.get('tags', {}).items()}
                stream = next((s for s in probe.get('streams', []) if s.get('codec_type') == 'audio'), {})
                tags.update({k.lower(): str(v) for k, v in stream.get('tags', {}).items() if k.lower() not in tags})
                duration = float(fmt.get('duration') or stream.get('duration') or 0)
                codec = stream.get('codec_name', '')
                bitrate = int(fmt.get('bit_rate') or 0)
                sample_rate = int(stream.get('sample_rate') or 0)
            except (subprocess.SubprocessError, ValueError, OSError):
                pass
        def number(name):
            m = re.match(r'\d+', tags.get(name, '0'))
            return int(m[0]) if m else 0
        # Untagged files still work, with sensible filename/folder fallbacks.
        title = tags.get('title', path.stem)
        artist = tags.get('artist') or tags.get('album_artist') or 'Unknown artist'
        cover = next((p.name for p in path.parent.iterdir() if p.is_file() and p.name.lower() in COVER_NAMES), None)
        data = {'id': key, 'title': title, 'artist': artist, 'albumArtist': tags.get('album_artist', artist),
                'album': tags.get('album', path.parent.name), 'number': number('track'), 'disc': number('disc'),
                'duration': duration, 'year': tags.get('date', tags.get('year', ''))[:4], 'genre': tags.get('genre', ''),
                'format': path.suffix[1:].upper(), 'codec': codec, 'bitrate': bitrate, 'sampleRate': sample_rate,
                'size': st.st_size, 'modified': st.st_mtime, 'folder': str(path.parent), 'filename': path.name,
                'coverFile': cover, 'added': time.time()}
        if old:
            data['added'] = json.loads(old[1]).get('added', data['added'])
        return key, str(path), stamp, json.dumps(data)

    def scan(self):
        try:
            paths, seen = [], set()
            for folder in self.folders:
                for root, dirs, files in os.walk(folder, followlinks=False):
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    for name in files:
                        p = (Path(root) / name).resolve()
                        if p.suffix.lower() in EXTENSIONS and p.is_file() and p.is_relative_to(Path(folder)) and p not in seen:
                            seen.add(p)
                            paths.append(p)
            with self.db() as db:
                old = {p: (s, m) for p, s, m in db.execute('SELECT path,stamp,metadata FROM tracks')}
            self.progress['total'] = len(paths)
            rows = []
            def process(p):
                try:
                    return self.metadata(p, old.get(str(p)))
                except (OSError, ValueError):
                    return None
            with ThreadPoolExecutor(max_workers=4) as pool:
                for row in pool.map(process, paths):
                    if row:
                        rows.append(row)
                    else:
                        self.progress['errors'] += 1
                    self.progress['done'] += 1
            with self.db() as db:
                db.execute('DELETE FROM tracks')
                db.executemany('INSERT INTO tracks VALUES (?,?,?,?)', rows)
            self.write_setting('lastScan', time.time())
        except Exception as exc:
            self.scan_error = str(exc)
        finally:
            self.scanning = False

    def artwork(self, track_id):
        path = self.track_path(track_id)
        # Folder artwork takes precedence; never read an arbitrary supplied path.
        for f in path.parent.iterdir():
            if f.is_file() and f.name.lower() in COVER_NAMES and f.resolve().parent == path.parent:
                return f
        stamp = path.stat().st_mtime_ns
        target = self.cache / f'{track_id}-{stamp}.jpg'
        missing = self.cache / f'{track_id}-{stamp}.noart'
        if target.exists():
            return target
        if missing.exists() or not shutil.which('ffmpeg'):
            return None
        tmp = self.cache / f'{track_id}-{secrets.token_hex(4)}.jpg'
        try:
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-frames:v', '1', '-vf', 'scale=600:600:force_original_aspect_ratio=decrease', '-y', str(tmp)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20, check=True)
            tmp.replace(target)
            return target
        except (OSError, subprocess.SubprocessError):
            tmp.unlink(missing_ok=True)
            missing.touch()
            return None

    def wav(self, track_id):
        path = self.track_path(track_id)
        target = self.cache / f'{track_id}-{path.stat().st_mtime_ns}.wav'
        if target.exists():
            return target
        if not shutil.which('ffmpeg'):
            raise ValueError('This codec needs FFmpeg. Install FFmpeg, then try again.')
        tmp = self.cache / f'{track_id}-{secrets.token_hex(4)}.wav'
        try:
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-vn', '-c:a', 'pcm_s16le', '-y', str(tmp)], capture_output=True, check=True, timeout=180)
            tmp.replace(target)
        except (OSError, subprocess.SubprocessError):
            tmp.unlink(missing_ok=True)
            raise ValueError('FFmpeg could not decode this file. Check that it is a valid audio file.')
        return target

class Handler(BaseHTTPRequestHandler):
    server_version = 'Spice/1.3.1'
    def log_message(self, *args):
        pass

    @property
    def lib(self):
        return self.server.library

    def safe_host(self):
        # Prevent DNS rebinding: this service is only available through loopback names.
        return self.headers.get('Host') in {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}'}

    def headers_for(self, status, kind, length=None):
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        if length is not None:
            self.send_header('Content-Length', str(length))

    def json(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode()
        self.headers_for(status, 'application/json; charset=utf-8', len(payload))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(payload)

    def do_HEAD(self):
        self.do_GET(head=True)

    def do_GET(self, head=False):
        if not self.safe_host():
            self.send_error(403)
            return
        url = urlsplit(self.path)
        try:
            if url.path == '/api/bootstrap':
                self.json({'application': 'spice-local', 'apiVersion': 4, 'version': '1.3.1', 'token': self.lib.token, 'tracks': self.lib.tracks(), 'state': self.lib.state,
                           'folders': self.lib.folders, 'defaultFolder': str(Path.home() / 'Music'),
                           'ffmpeg': bool(shutil.which('ffmpeg')), 'ffprobe': bool(shutil.which('ffprobe')),
                           'folderPicker': bool(shutil.which('zenity') or shutil.which('kdialog')),
                           'scanning': self.lib.scanning, 'progress': self.lib.progress, 'error': self.lib.scan_error})
            elif url.path == '/api/status':
                self.json({'scanning': self.lib.scanning, 'progress': self.lib.progress, 'error': self.lib.scan_error})
            elif url.path.startswith('/api/lyrics/'):
                self.json(self.lib.lyrics(url.path.rsplit('/', 1)[1]))
            elif url.path.startswith('/api/audio/'):
                track_id = url.path.rsplit('/', 1)[1]
                path = self.lib.wav(track_id) if parse_qs(url.query).get('format') == ['wav'] else self.lib.track_path(track_id)
                self.send_file(path, head=head)
            elif url.path.startswith('/api/art/'):
                track_id = url.path.rsplit('/', 1)[1]
                path = self.lib.artwork(track_id)
                if path:
                    self.send_file(path, head=head, cache=True)
                else:
                    digest = hashlib.sha256(track_id.encode()).digest()
                    hue = digest[0] * 360 // 256
                    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl({hue},35%,34%)"/><stop offset="1" stop-color="hsl({(hue+50)%360},30%,10%)"/></linearGradient></defs><path fill="url(#g)" d="M0 0h600v600H0z"/><g fill="none" stroke="#fff" stroke-opacity=".12">'+''.join(f'<circle cx="300" cy="300" r="{r}"/>' for r in range(45,270,20))+'</g><circle cx="300" cy="300" r="62" fill="#ffffff18"/><circle cx="300" cy="300" r="10" fill="#111"/></svg>'
                    data = svg.encode()
                    self.headers_for(200, 'image/svg+xml', len(data)); self.end_headers()
                    if not head:
                        self.wfile.write(data)
            else:
                relative = url.path.lstrip('/') or 'index.html'
                p = (BASE / 'web' / relative).resolve()
                if not p.is_relative_to(BASE / 'web') or not p.is_file():
                    self.send_error(404)
                    return
                self.send_file(p, head=head)
        except FileNotFoundError as exc:
            self.json({'error': str(exc)}, 404)
        except ValueError as exc:
            self.json({'error': str(exc)}, 400)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except OSError:
            self.json({'error': 'Unable to read the file. Check permissions or reconnect your drive.'}, 500)

    def send_file(self, path, head=False, cache=False):
        with path.open('rb') as f:
            size = os.fstat(f.fileno()).st_size
            start, end, status = 0, size - 1, 200
            header = self.headers.get('Range')
            if header:
                match = re.fullmatch(r'bytes=(\d*)-(\d*)', header.strip())
                if not match or not any(match.groups()) or not size:
                    self.range_error(size); return
                a, b = match.groups()
                if a:
                    start = int(a); end = min(int(b), size - 1) if b else size - 1
                else:
                    start = max(0, size - int(b))
                if start >= size or start > end:
                    self.range_error(size); return
                status = 206
            length = max(0, end-start+1)
            kind = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
            self.headers_for(status, kind, length)
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Cache-Control', 'private, max-age=3600' if cache else 'no-cache')
            if status == 206:
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.end_headers()
            if not head:
                f.seek(start)
                while length:
                    chunk = f.read(min(length, 131072))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    length -= len(chunk)

    def range_error(self, size):
        self.headers_for(416, 'text/plain', 0)
        self.send_header('Content-Range', f'bytes */{size}')
        self.end_headers()

    def do_POST(self):
        if not self.safe_host() or self.headers.get('X-Spice-Token') != self.lib.token:
            self.send_error(403); return
        origin = self.headers.get('Origin')
        if origin and origin not in {f'http://127.0.0.1:{self.server.server_port}', f'http://localhost:{self.server.server_port}'}:
            self.send_error(403); return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length > 2_000_000 or length < 0:
                self.json({'error': 'Request is too large.'}, 413); return
            data = json.loads(self.rfile.read(length) or b'{}')
            if not isinstance(data, dict):
                raise ValueError('Expected a JSON object.')
            if self.path == '/api/scan':
                folders = data.get('folders')
                if folders is not None and (not isinstance(folders, list) or not all(isinstance(f, str) for f in folders) or len(folders) > 100):
                    raise ValueError('Choose up to 100 music folders.')
                self.lib.begin_scan(folders)
                self.json({'ok': True})
            elif self.path.startswith('/api/lyrics/'):
                self.json(self.lib.lyrics(self.path.rsplit('/', 1)[1], data))
            elif self.path == '/api/shutdown':
                self.json({'ok': True})
                threading.Thread(target=self.server.shutdown, daemon=True).start()
            elif self.path == '/api/browse':
                if shutil.which('zenity'):
                    cmd = ['zenity', '--file-selection', '--directory', '--title=Choose your music folder']
                elif shutil.which('kdialog'):
                    cmd = ['kdialog', '--getexistingdirectory', str(Path.home() / 'Music'), '--title', 'Choose your music folder']
                else:
                    raise ValueError('No folder picker is installed. Paste your folder path instead.')
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
                    self.json({'folder': result.stdout.strip() if result.returncode == 0 else None})
                except subprocess.TimeoutExpired:
                    self.json({'folder': None})
            elif self.path == '/api/state':
                allowed = {'liked', 'playlists', 'recent', 'theme', 'volume', 'customTheme', 'lastTrack', 'lastTime', 'studio', 'lyricOffsets', 'glass'}
                with self.lib.lock:
                    for key, value in data.items():
                        if key in allowed:
                            self.lib.state[key] = value
                    self.lib.write_setting('state', self.lib.state)
                self.json({'ok': True})
            else:
                self.json({'error': 'Unknown action.'}, 404)
        except (ValueError, TypeError) as exc:
            self.json({'error': str(exc)}, 400)
        except OSError:
            self.json({'error': 'Could not save. Check free disk space and permissions.'}, 500)


def main():
    parser = argparse.ArgumentParser(description='Spice — your music, on your terms.')
    parser.add_argument('--port', type=int, default=43915)
    parser.add_argument('--data-dir', default=str(Path(os.environ.get('XDG_DATA_HOME', Path.home()/'.local/share'))/'spice-local'))
    parser.add_argument('--music', action='append', help='Music folder to add (repeatable).')
    parser.add_argument('--no-open', action='store_true')
    args = parser.parse_args()
    lib = Library(args.data_dir)
    if args.music:
        lib.begin_scan(list(dict.fromkeys(lib.folders + args.music)))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    except OSError as exc:
        print(f'Cannot start Spice: {exc}. Try another --port.', flush=True)
        raise SystemExit(1)
    server.library = lib
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'Spice is ready: {url}', flush=True)
    if not args.no_open:
        browser = next((shutil.which(x) for x in ('google-chrome', 'chromium', 'chromium-browser') if shutil.which(x)), None)
        if browser:
            subprocess.Popen([browser, '--app='+url, '--class=SpiceLocal'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
