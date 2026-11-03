import sys
plantilla, out = sys.argv[1], sys.argv[2]
P = [
 ("a-petroleo", "A · Petróleo profundo", dict(bg="#061918", s="#0E2827", b="#1D3F3D", b2="#2E5653", t="#EEF5F2", m="#9DB8B4", a="#14A79D", h="#F8C000", oh="#141414", glow="rgba(20,167,157,.20)", hglow="rgba(248,192,0,.55)")),
 ("b-tinta-oro", "B · Tinta y oro", dict(bg="#0F0F0D", s="#1B1B18", b="#2D2D28", b2="#3F3F38", t="#F4F1E8", m="#A9A497", a="#0FA095", h="#F8C000", oh="#141414", glow="rgba(248,192,0,.10)", hglow="rgba(248,192,0,.5)")),
 ("c-grafito-menta", "C · Grafito y menta", dict(bg="#111517", s="#1A2023", b="#2A3236", b2="#3A454A", t="#EDF2F2", m="#9AA7AA", a="#F8C000", h="#3FE0C5", oh="#0B1A17", glow="rgba(63,224,197,.12)", hglow="rgba(63,224,197,.5)")),
 ("d-noche-lima", "D · Noche y lima", dict(bg="#07141C", s="#0F222C", b="#1D3843", b2="#2B4D5B", t="#EAF3F5", m="#93AEB8", a="#18B5A6", h="#D6F53C", oh="#0D1A05", glow="rgba(24,181,166,.18)", hglow="rgba(214,245,60,.5)")),
]
base = open(plantilla, encoding="utf-8").read()
# La librería del QR va dentro de cada página, así se dibuja también sin internet.
qrious = open("node_modules/qrious/dist/qrious.min.js", encoding="utf-8").read().replace("//# sourceMappingURL=qrious.min.js.map", "")
# El QR de ejemplo apunta a la app en esta laptop (misma red Wi-Fi).
import socket
try:
    so = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); so.connect(("10.255.255.255", 1)); ip = so.getsockname()[0]; so.close()
except OSError:
    ip = "localhost"
base = base.replace("{{QRIOUS}}", qrious)
print("Los QR abren las landings en:", f"http://{ip}:3000/prototipos/")
for slug, nombre, c in P:
    vars_ = f"--bg:{c['bg']};--s:{c['s']};--b:{c['b']};--b2:{c['b2']};--t:{c['t']};--m:{c['m']};--a:{c['a']};--h:{c['h']};--on-h:{c['oh']};--glow:{c['glow']};--hglow:{c['hglow']};"
    selector = "".join(
        f'<a href="{s2}.html" title="{n2}" aria-label="{n2}"{" aria-current=page" if s2 == slug else ""} style="background:linear-gradient(135deg,{c2["bg"]} 50%,{c2["h"]} 50%)"></a>'
        for s2, n2, c2 in P)
    html = base.replace("{{VARS}}", vars_).replace("{{NOMBRE}}", nombre).replace("{{BG}}", c["bg"]).replace("{{SELECTOR}}", selector).replace("{{QR_URL}}", f"http://{ip}:3000/prototipos/{slug}.html")
    open(f"{out}/{slug}.html", "w", encoding="utf-8").write(html)
print("4 prototipos regenerados")
