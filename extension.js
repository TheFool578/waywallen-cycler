import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import Gio from 'gi://Gio';

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
                    } catch(e) {
                        console.log('WaywallenCycler ERROR ' + method + ': ' + e);
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