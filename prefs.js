import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';

export default class WaywallenCyclerPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Atajos de teclado',
            description: 'Pulsa un atajo y luego pulsa la nueva combinacion',
        });
        page.add(group);

        for (const key of ['next-wallpaper', 'prev-wallpaper']) {
            const title = key === 'next-wallpaper' ? 'Siguiente fondo' : 'Fondo anterior';
            const row = new Adw.ActionRow({title});
            const button = new Gtk.Button({
                label: settings.get_strv(key)[0] ?? 'sin definir',
                valign: Gtk.Align.CENTER
            });
            button.connect('clicked', () => {
                const dialog = new Gtk.Dialog({
                    title: 'Pulsa la nueva combinacion',
                    transient_for: window,
                    modal: true,
                });
                dialog.add_button('cancelar', Gtk.ResponseType.CANCEL);
                const label = new Gtk.Label({label: 'pulsa las teclas...'});
                dialog.get_content_area().append(label);
                const controller = new Gtk.EventControllerKey();
                dialog.add_controller(controller);
                controller.connect('key-pressed', (c, keyval, keycode, state) => {
                    let mask = state & Gtk.accelerator_get_default_mod_mask();
                    if (mask === 0 && keyval !== Gdk.KEY_Escape) {
                        return false;
                    }
                    const accel = Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask);
                    settings.set_strv(key, [accel]);
                    button.set_label(accel);
                    dialog.response(Gtk.ResponseType.APPLY);
                });
                dialog.connect('response', () => dialog.destroy());
                dialog.present();
            });
            settings.connect('changed::' + key, () => {
                button.set_label(settings.get_strv(key)[0] ?? 'Sin definir');
            });
            row.add_suffix(button);
            group.add(row);
        }

        window.add(page);
    }
}
