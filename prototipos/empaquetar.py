# Copia los prototipos de public/prototipos a prototipos/para-abrir con las imágenes
# de los personajes incluidas, para abrirlos con doble clic sin servidor.
import sys, base64
pub, out = sys.argv[1], sys.argv[2]
NOMBRES = ("a-petroleo", "b-tinta-oro", "c-grafito-menta", "d-noche-lima")
datos = {n: "data:image/webp;base64," + base64.b64encode(open(f"{pub}/{n}", "rb").read()).decode() for n in ("duo-l.webp", "duo-r.webp")}
for f in NOMBRES:
    s = open(f"{pub}/prototipos/{f}.html", encoding="utf-8").read()
    for n, d in datos.items():
        s = s.replace(f"../{n}", d)
    for g in NOMBRES:
        s = s.replace(f'href="{g}.html"', f'href="networkeando-{g}.html"')
    open(f"{out}/networkeando-{f}.html", "w", encoding="utf-8").write(s)
print("4 archivos para abrir listos")
