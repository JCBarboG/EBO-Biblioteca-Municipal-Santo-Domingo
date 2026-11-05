# EBO (Biblioteca Municipal Santo Domingo)

Versión de EBO hecha para catalogar en la Biblioteca Municipal Santo Domingo.
Extrae con OCR los datos de las portadas y los exporta a Excel, y además usa la
base de la biblioteca para ayudar mientras se cataloga. Corre en el navegador.

Sitio: https://jcbarbog.github.io/EBO-Biblioteca-Municipal-Santo-Domingo/

## Funciones propias de la biblioteca

- **Catálogo consultable** con los registros de la base.
- **Aviso de duplicados** por ISBN, título y autor, o fascículo, con «Sumar ejemplar».
- **Autocompletado** de autor, materia, lugar y editorial con la forma más usada en la base.
- **Clasificación sugerida** según las materias y el Cutter que la base ya usa para el autor.
- **Id continuo** después del último número de la base.
- **Revisión al guardar**: ISBN, año, ejemplares, idioma y año del pie de imprenta.
- **Tachuela** para recordar un campo en el siguiente registro y **duplicar el último registro**.
- **Constructores** de descripción física y de lugar y editorial, y frases para la nota.
- **Código de barras y búsqueda de ISBN en línea** (envía solo el ISBN a Open Library y Google Books).
- **Columnas de revista** iguales a la hoja REVISTA de la base.
- **Exportación limpia**: sin espacios de más y en orden por título.

## Actualizar el catálogo

Cuando la biblioteca entregue una base nueva:

```bash
npm run catalog -- "ruta/a/la/base.xlsx"
```

Genera `public/data/catalogo.json` y `src/constants/catalogMeta.js`. La limpieza
solo acomoda datos (espacios, ISBN completos, idioma, columnas corridas); no
corrige títulos, autores ni materias.

## Desarrollo

```bash
npm install      # también copia los assets de Tesseract a public/
npm run dev      # servidor local
npm run build    # compila a dist/
npm run deploy   # publica dist/ en la rama gh-pages (GitHub Pages)
```
