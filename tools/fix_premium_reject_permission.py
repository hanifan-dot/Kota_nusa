#!/usr/bin/env python3
"""Narrow, backup-first patch of LIVE Premium Shop rejection rule."""
import copy,datetime,json,subprocess,sys,urllib.request,urllib.parse
PROJECT="kotanusa-6ed9c"
URL="https://kotanusa-6ed9c-default-rtdb.asia-southeast1.firebasedatabase.app/.settings/rules.json"
OLD="data.child('status').val() == 'reported' && (newData.child('status').val() == 'approved' || newData.child('status').val() == 'rejected')"
NEW="(("+OLD+") || (data.child('status').val() == 'pending' && newData.child('status').val() == 'rejected' && newData.child('merchantTx').val() == '' && data.child('merchantTx').val() == ''))"
def fail(msg):
    sys.exit("BATAL: "+msg)
def cmd(*args):
    try: return subprocess.check_output(args,stderr=subprocess.DEVNULL,text=True,timeout=30).strip()
    except Exception: fail("Cloud Shell belum terautentikasi dengan benar.")
def request(method,token,data=None):
    u=URL+"?access_token="+urllib.parse.quote(token,safe="")
    b=json.dumps(data,ensure_ascii=False).encode() if data is not None else None
    try:
        with urllib.request.urlopen(urllib.request.Request(u,data=b,method=method,headers={"Content-Type":"application/json"}),timeout=60) as response: return json.load(response)
    except Exception: fail("Gagal mengakses Firebase "+method+". Periksa console tanpa mengulang otomatis.")
def get_rule(doc):
    try: return doc["rules"]["nusaPremiumOrdersV2"]["$orderId"][".write"]
    except (KeyError,TypeError): fail("Struktur Rules tidak dikenali.")
def main():
    if cmd("gcloud","config","get-value","project")!=PROJECT: fail("Proyek Cloud Shell salah.")
    token=cmd("gcloud","auth","print-access-token")
    if not token: fail("Izin Cloud Shell tidak tersedia.")
    active=request("GET",token)
    curr=get_rule(active)
    if not isinstance(curr,str): fail("Aturan Premium Shop tidak berbentuk string.")
    if NEW in curr:
        print("SUDAH AKTIF: Pesanan Belum Bayar bisa ditolak.");return
    if curr.count(OLD)!=1: fail("Aturan LIVE berbeda; tidak diubah.")
    filename="premium-rules-backup-"+datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")+".json"
    with open(filename,"w",encoding="utf-8") as out: json.dump(active,out,ensure_ascii=False,indent=2)
    updated=copy.deepcopy(active)
    updated["rules"]["nusaPremiumOrdersV2"]["$orderId"][".write"]=curr.replace(OLD,NEW)
    print("Backup Rules LIVE dibuat:",filename)
    print("Hanya mengizinkan Presiden/Wakil resmi menolak pesanan PENDING (belum bayar).")
    print("Tidak mengizinkan persetujuan tanpa verifikasi. Data warga dan saldo tidak diubah.")
    if input("Ketik TERAPKAN untuk ubah aturan LIVE (lainnya membatalkan): ").strip()!="TERAPKAN":
        print("BATAL. Aturan LIVE belum diubah.");return
    request("PUT",token,updated)
    check=request("GET",token)
    if get_rule(check)==get_rule(updated): print("SUCCESS: Rules penolakan Premium Shop aktif.")
    else: fail("Update belum terverifikasi. Lihat Firebase Console.")
if __name__=="__main__": main()
