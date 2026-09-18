# Waywallen Cycler

Extensión de GNOME Shell para pasar de fondo en [Waywallen](https://github.com/waywallen/waywallen) sin abrir su UI.

Atajos por defecto:

- Siguiente fondo: `Ctrl+Shift+Right`
- Fondo anterior: `Ctrl+Shift+Left`

Funciona llamando por D-Bus al daemon de Waywallen:

- Bus: `org.waywallen.waywallen.Daemon`
- Objeto: `/org/waywallen/waywallen/Daemon`
- Interfaz: `org.waywallen.waywallen.Daemon1`
- Métodos: `Next` / `Previous` (PascalCase, así los expone `zbus` a partir de `fn next` / `fn previous` en Rust)

## Requisitos

- GNOME Shell 50 (ver `metadata.json` → `shell-version`)
- Waywallen corriendo en el mismo bus de sesión (nativo / AppImage).
  Con Waywallen en Flatpak confinado el nombre D-Bus no se ve desde el host y no funcionará.
- Waywallen con al menos 2 fondos / playlist activa para que se note el cambio.

## Instalación

```bash
mkdir -p ~/.local/share/gnome-shell/extensions
cp -r waywallen-cycler@david.local ~/.local/share/gnome-shell/extensions/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/waywallen-cycler@david.local/schemas/
gnome-extensions enable waywallen-cycler@david.local
```

En Wayland cierra sesión y vuelve a entrar (en X11 valía `Alt+F2` → `r`).
Los atajos se cambian en `Configuración > Teclado > Atajos`.

## Probar sin la extensión

```bash
gdbus call --session \
  --dest org.waywallen.waywallen.Daemon \
  --object-path /org/waywallen/waywallen/Daemon \
  --method org.waywallen.waywallen.Daemon1.Next

gdbus call --session \
  --dest org.waywallen.waywallen.Daemon \
  --object-path /org/waywallen/waywallen/Daemon \
  --method org.waywallen.waywallen.Daemon1.Previous
```

Si eso cambia el fondo pero el atajo no, el problema es la extensión / keybinding. Si eso ya falla con `NameHasNoOwner`, Waywallen no está exponiendo D-Bus en tu sesión.

## Desarrollo

Los fuentes viven en esta carpeta. GNOME solo carga lo que hay en
`~/.local/share/gnome-shell/extensions/waywallen-cycler@david.local/`,
por eso después de editar hay que volver a copiar, recompilar schemas y
re-activar. Ver `schemas/org.gnome.shell.extensions.waywallen-cycler.gschema.xml`.

Licencia: MIT.
