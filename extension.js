import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export default class WaywallenCycler extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._lastChange = 0;

        Main.wm.addKeybinding(
                'next-wallpaper',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                () => {
            this._callWaywallen('Next', 0);
        }
        );

        Main.wm.addKeybinding(
                'prev-wallpaper',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                () => {
            this._callWaywallen('Previous', 0);
        }
        );
    }

    _callWaywallen(method, attempt = 0) {
        if (attempt === 0) {
            const now = Date.now();
            if (now - (this.lastChange || 0) < 2000)
                return;
            this._lastChange = now;
        }
        Gio.DBus.session.call(
                'org.waywallen.waywallen.Daemon',
                '/org/waywallen/waywallen/Daemon',
                'org.waywallen.waywallen.Daemon1',
                method,
                null,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                (conn, res) => {
            try {
                conn.call_finish(res);
                this._getCurrentId(method, attempt);
            } catch (e) {
                console.log('WaywallenCycler ERROR ' + method + ': ' + e);
            }
        }
        );
    }

    _getCurrentId(method, attempt) {
        Gio.DBus.session.call(
                'org.waywallen.waywallen.Daemon',
                '/org/waywallen/waywallen/Daemon',
                'org.freedesktop.DBus.Properties',
                'Get',
                new GLib.Variant('(ss)', ['org.waywallen.waywallen.Daemon1', 'CurrentWallpaperId']),
                new GLib.VariantType('(v)'),
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                (conn, res) => {
            try {
                const result = conn.call_finish(res);
                const id = result.deepUnpack()[0].deepUnpack();
                this._showWithInfo(id, method, attempt);
            } catch (e) {
                console.log('waywallenCycler ERROR get ID: ' + e);
            }
        }
        );
    }

    _showWithInfo(id, method, attempt) {
        try {
            const script = this.path + '/get_wallpaper_info.py';
            const proc = Gio.Subprocess.new(
                    ['python3', script, String(id)],
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
                    );
            proc.communicate_utf8_async(null, null, (p, res) => {
                try {
                    const [, stdout] = p.communicate_utf8_finish(res);
                    const info = JSON.parse(stdout);
                    const allowHidden = this._settings ? this._settings.get_boolean('allow-hidden') : true;
                    if (info.hidden && !allowHidden) {
                        if (attempt < 5) {
                            this._callWaywallen(method, attempt + 1);
                            return;
                        }
                    }
                    const name = info.name ?? ('Fondo ' + id);
                    let icon = Gio.ThemedIcon.new('image-x-generic');
                    if (info.preview) {
                        const f = Gio.File.new_for_path(info.preview);
                        if (f.query_exists(null))
                            icon = Gio.FileIcon.new(f);
                    }
                    if (this._settings && this._settings.get_boolean('show-osd'))
                        Main.osdWindowManager.showAll(icon, name, null, null);
                    if (this._settings && this._settings.get_boolean('show-notification'))
                        Main.notify('Waywallen Cycler', name);
                } catch (e) {
                    console.log('WaywallenCycler ERROR info: ' + e);
                }
            });
        } catch (e) {
            console.log('WaywallenCycler ERROR spawn: ' + e);
        }
    }

    disable() {
        Main.wm.removeKeybinding('next-wallpaper');
        Main.wm.removeKeybinding('prev-wallpaper');
        this._settings = null;
    }
}