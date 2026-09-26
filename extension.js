import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export default class WaywallenCycler extends Extension {
    enable() {
        this._settings = this.getSettings();

        Main.wm.addKeybinding(
                'next-wallpaper',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                () => {
            this._callWaywallen('Next');
        }
        );

        Main.wm.addKeybinding(
                'prev-wallpaper',
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL,
                () => {
            this._callWaywallen('Previous');
        }
        );
    }

    _callWaywallen(method) {
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
                this._getCurrentId();
            } catch (e) {
                console.log('WaywallenCycler ERROR ' + method + ': ' + e);
            }
        }
        );
    }

    _getCurrentId() {
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
                if (this._settings && this._settings.get_boolean('show-osd'))
                    Main.osdWindowManager.showAll(Gio.ThemedIcon.new('image-x-generic'), 'Fondo: ' + id, null, null);
                if (this._settings && this._settings.get_boolean('show-notification'))
                    Main.notify('Waywallen Cycler', 'Fondo: ' + id);
            } catch (e) {
                console.log('WaywallenCycler ERROR get ID' + e);
            }
        }
        );
    }

    disable() {
        Main.wm.removeKeybinding('next-wallpaper');
        Main.wm.removeKeybinding('prev-wallpaper');
        this._settings = null;
    }
}