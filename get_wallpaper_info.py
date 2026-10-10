#!/usr/bin/env python3
import sys, os, sqlite3, json

def main():
    if len (sys.argv) !=2:
        print(json.dumps({"error": "uso: get_wallpaper_info.py <id>"}))
        return 1
    wid = sys.argv[1]
    db = os.path.expanduser("~/.var/app/org.waywallen.waywallen/data/waywallen/waywallen-v2.db")
    con = sqlite3.connect(db)
    cur = con.cursor()
    cur.execute("SELECT display_name, path, preview_path, library_id FROM item WHERE id=?", (wid,))
    row = cur.fetchone()
    if not row:
        print(json.dumps({"error": f"id {wid} no encontrado"}))
        return 1
    name, path, preview_rel, lib_id = row
    cur.execute("SELECT path FROM library WHERE id=?", (lib_id,))
    librow = cur.fetchone()
    base = librow[0] if librow else ""
    if base == "/home/david/.steam/steam":
        base = "/home/david/.local/share/Steam"
    if preview_rel and not os.path.isabs(preview_rel):
        cand1 = os.path.join(base, preview_rel) if base else preview_rel
        cand2 = os.path.join("/home/david/.local/share/Steam", preview_rel)
        preview_abs = cand1 if os.path.exists(cand1) else cand2
    else:
        preview_abs = preview_rel
    print(json.dumps({"id": wid, "name": name, "preview": preview_abs}))
    return 0

if __name__ == "__main__":
    sys.exit(main())