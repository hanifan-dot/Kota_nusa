#!/usr/bin/env python3
"""Kota Nusa: narrowly patch the live Realtime Database GOAT order pick validator.

Run from Google/Firebase Cloud Shell, authenticated as the Firebase project owner.
Makes a timestamped local backup of the LIVE rules before editing.
Modifies only the validation expression at
/rules/nusaFootballGoatOrdersV1/$orderId/pick/.validate.
Never writes player data, payment records, or credentials.
"""
import copy
import datetime as dt
import json
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PROJECT = "kotanusa-6ed9c"
INSTANCE = "kotanusa-6ed9c-default-rtdb"
DB_URL = f"https://{INSTANCE}.asia-southeast1.firebasedatabase.app/.settings/rules.json"
OLD = "newData.val() == 'arjuna' || newData.val() == 'langit' || newData.val() == 'garda'"
NEW = OLD + " || newData.val() == 'neymar' || newData.val() == 'mbappe' || newData.val() == 'haaland' || newData.val() == 'ronaldo' || newData.val() == 'messi'"

def die(msg):
    print(f"\nBATAL: {msg}", file=sys.stderr)
    raise SystemExit(1)

def get_token():
    try:
        token = subprocess.run(
            ["gcloud", "auth", "print-access-token"],
            capture_output=True, text=True, check=True, timeout=30,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        die("Gagal memperoleh izin Google Cloud Shell. Pastikan akun Firebase benar.")
    if not token:
        die("Token autentikasi tidak tersedia.")
    return token

def send(method, token, body=None):
    url = DB_URL + "?access_token=" + urllib.parse.quote(token, safe="")
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {"Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            payload = res.read()
        return json.loads(payload) if payload else None
    except urllib.error.HTTPError as err:
        # Never print the URL because it contains a temporary access token.
        die(f"Firebase menolak operasi {method} (HTTP {err.code}). Tidak lanjut.")
    except (urllib.error.URLError, TimeoutError):
        die("Koneksi Firebase gagal; perubahan belum dapat dipastikan. Periksa Rules Console.")

def get_pick(doc):
    try:
        return doc["rules"]["nusaFootballGoatOrdersV1"]["$orderId"]["pick"][".validate"]
    except (KeyError, TypeError):
        die("Struktur aturan pesanan GOAT berbeda. Jangan menimpa aturan produksi.")

def main():
    print("Kota Nusa — perbaikan validasi pesanan GOAT (bukan proses pembayaran)")
    print(f"Project: {PROJECT} | Database: {INSTANCE}")
    print("Memeriksa Rules Firebase LIVE menggunakan akun Cloud Shell kamu...")
    token = get_token()
    active = send("GET", token)
    if not isinstance(active, dict):
        die("Rules aktif bukan objek JSON.")
    current = get_pick(active)
    if current == NEW:
        print("✅ Validasi ID GOAT sudah benar di Firebase aktif. Tidak ada yang diubah.")
        return
    if current != OLD:
        die("Validator Rules LIVE berbeda dari versi yang diharapkan. Dihentikan untuk mencegah perubahan tak sengaja.")
    backup = "firebase-rules-live-backup-" + dt.datetime.now(dt.timezone.utc).strftime("%Y%m%d-%H%M%S") + ".json"
    with open(backup, "w", encoding="utf-8") as fp:
        json.dump(active, fp, ensure_ascii=False, indent=2)
        fp.write("\n")
    patched = copy.deepcopy(active)
    patched["rules"]["nusaFootballGoatOrdersV1"]["$orderId"]["pick"][".validate"] = NEW
    assert get_pick(patched) == NEW
    print(f"✅ Cadangan Rules LIVE disimpan: {backup}")
    print("Perubahan tunggal: izinkan ID neymar, mbappe, haaland, ronaldo, messi pada pesanan GOAT.")
    print("Semua aturan rumah, KTP, kebun, koin, Football Room tetap seperti semula.")
    print("Ini mengganti Rules LIVE; tidak mengubah data warga dan tidak menyetujui pembayaran.")
    try:
        answer = input("\nKetik TERAPKAN untuk mengubah Rules LIVE, atau Enter untuk batal: ").strip()
    except (EOFError, KeyboardInterrupt):
        answer = ""
    if answer != "TERAPKAN":
        print("Dibatalkan. Firebase aktif tidak berubah.")
        return
    send("PUT", token, patched)
    verified = send("GET", token)
    if get_pick(verified) == NEW:
        print("\n✅ SUCCESS: Validator GOAT telah diperbarui di Firebase aktif.")
        print("Uji tombol Buat Pesanan di game TANPA melakukan pembayaran.")
    else:
        die("Respons Firebase tidak menunjukkan hasil yang diharapkan. Periksa Rules Console.")

if __name__ == "__main__":
    main()
