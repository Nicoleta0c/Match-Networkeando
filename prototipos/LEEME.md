# Prototipos «El hilo que une»

Cuatro páginas de prueba con el mismo diseño y distinta paleta oscura. Se ven en
http://localhost:3000/prototipos/ con `npm run dev` corriendo.

- `plantilla.html`: la página completa con `{{VARS}}`, `{{NOMBRE}}`, `{{BG}}` y `{{SELECTOR}}`.
- `generar.py`: escribe las 4 versiones en `public/prototipos/`.

```bash
python prototipos/generar.py prototipos/plantilla.html public/prototipos
```
