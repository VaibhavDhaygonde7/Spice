#!/usr/bin/env python3
"""User-run Fedora/Linux installer. No root, no downloads, no package changes."""
import argparse
import os
from pathlib import Path
import shutil
import sys

BASE = Path(__file__).resolve().parent
DATA = Path(os.environ.get('XDG_DATA_HOME', Path.home()/'.local/share'))
APP = DATA/'spice-local'/'app'
DESKTOP = DATA/'applications'/'spice-local.desktop'

def main():
    parser = argparse.ArgumentParser(description='Install the Spice launcher for the current Linux user.')
    parser.add_argument('--uninstall', action='store_true', help='Remove installed application and launcher; keep your library and music.')
    args = parser.parse_args()
    if args.uninstall:
        DESKTOP.unlink(missing_ok=True)
        if APP.is_dir():
            shutil.rmtree(APP)
        print('Spice launcher removed. Your library data and original music have been kept.')
        return
    APP.mkdir(parents=True, exist_ok=True)
    for name in ('app.py', 'lyrics.py', 'launch.py', 'Spice.sh', 'README.md', 'LICENSE'):
        source=BASE/name
        if source.resolve() != (APP/name).resolve():
            shutil.copy2(source, APP/name)
    if (BASE/'web').resolve() != (APP/'web').resolve():
        shutil.copytree(BASE/'web', APP/'web', dirs_exist_ok=True)
    (APP/'Spice.sh').chmod(0o755)
    DESKTOP.parent.mkdir(parents=True, exist_ok=True)
    # Desktop Entry quoting is not shell quoting. Percent signs need escaping.
    def quote(value):
        return '"'+str(value).replace('\\','\\\\').replace('"','\\"').replace('`','\\`').replace('$','\\$').replace('%','%%')+'"'
    DESKTOP.write_text('[Desktop Entry]\nType=Application\nName=Spice\nComment=Your music, on your terms\nExec='+quote(sys.executable)+' '+quote(APP/'launch.py')+'\nIcon='+str(APP/'web/icon.svg')+'\nTerminal=false\nCategories=AudioVideo;Audio;Player;\nStartupWMClass=SpiceLocal\nKeywords=Music;Local;Offline;Spotify;\n')
    print(f'Installed Spice. Open it from your application menu.\nApplication: {APP}\nLauncher: {DESKTOP}\nNo music files were copied or changed.')

if __name__=='__main__':
    main()
