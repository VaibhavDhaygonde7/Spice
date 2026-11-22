#!/usr/bin/env python3
"""Start a compatible local Spice service, then open its app window."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = Path(__file__).resolve().parent
URL = 'http://127.0.0.1:43915'
API_VERSION = 4


def service_info():
    try:
        with urllib.request.urlopen(URL+'/api/bootstrap', timeout=2) as response:
            data = json.load(response)
        return data if data.get('application') == 'spice-local' else None
    except (OSError, ValueError):
        return None


def is_spice():
    return service_info() is not None


def stop_service(info):
    request = urllib.request.Request(URL+'/api/shutdown', data=b'{}', headers={
        'Content-Type':'application/json', 'X-Spice-Token':info['token']}, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=3):
            pass
    except (OSError, KeyError) as exc:
        raise RuntimeError('The older Spice service could not stop automatically. Stop its terminal with Ctrl+C, then launch this updated copy again. Your library is kept.') from exc
    for _ in range(40):
        if service_info() is None:
            return
        time.sleep(.1)
    raise RuntimeError('Spice is still stopping. Wait a moment and launch it again.')


def ensure_service():
    info = service_info()
    if info:
        version = info.get('apiVersion', 1)
        if version == API_VERSION:
            return
        if not isinstance(version, int) or version > API_VERSION:
            raise RuntimeError('A newer Spice service is already running. Use its matching launcher instead of downgrading it.')
        print('Updating the running Spice service; keeping your library.', flush=True)
        stop_service(info)
    data = Path(os.environ.get('XDG_DATA_HOME', Path.home()/'.local/share'))/'spice-local'
    data.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (data/'server.log').open('a') as log:
        process = subprocess.Popen([sys.executable, str(BASE/'app.py'), '--no-open'], stdout=log, stderr=log, start_new_session=True)
    for _ in range(100):
        info = service_info()
        if info and info.get('apiVersion') == API_VERSION:
            return
        if process.poll() is not None:
            raise RuntimeError(f'Spice could not start. See {data}/server.log. Port 43915 may be in use.')
        time.sleep(.1)
    raise RuntimeError('Spice took too long to start. Check server.log.')


def main():
    parser = argparse.ArgumentParser(description='Launch or stop Spice.')
    parser.add_argument('--stop', action='store_true')
    parser.add_argument('--no-open', action='store_true', help='Start the service without opening another window.')
    args = parser.parse_args()
    try:
        if args.stop:
            info = service_info()
            if info:
                stop_service(info)
                print('Spice stopped. Your library has been saved.')
            else:
                print('Spice is not running on its default port.')
            return 0
        ensure_service()
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    if args.no_open:
        print('Spice is ready: '+URL)
        return 0
    browser = next((shutil.which(x) for x in ('google-chrome', 'chromium', 'chromium-browser') if shutil.which(x)), None)
    if browser:
        subprocess.Popen([browser, '--app='+URL, '--class=SpiceLocal'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    else:
        import webbrowser
        webbrowser.open(URL)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
