# Alex Dev - Portafolio

Sitio estático generado con **Astro**. Contiene una demo 3D (Three.js) como proyecto principal.

## Requisitos
- Node.js 18+ (recomendado)

## Comandos
- npm install
- npm run dev   # desarrollo
- npm run build # build para producción
- npm run preview # previsualizar el build

## Notas
- El build se genera en `dist/` y el workflow de GitHub Actions (`.github/workflows/deploy.yml`) está preparado para desplegar a la rama `gh-pages`.

## Deploy
- Define la variable de entorno `SITE` con la URL de tu sitio (por ejemplo `https://tuusuario.github.io/tu-repo`) en los Secrets/Variables de GitHub Actions o reemplaza el valor por defecto en `astro.config.mjs`.
- Empuja a `main` y el workflow hará build y publicará en la rama `gh-pages`.

## Local testing
- Instala dependencias: `npm install`
- Desarrollo: `npm run dev`
- Build: `npm run build`

> Nota: si tu navegador no soporta WebGL, la página mostrará un fallback con una imagen previa y el panel de UI seguirá accesible.

## Troubleshooting CDN / Tracking Prevention
Si ves mensajes tipo "Tracking Prevention blocked access to storage" en la consola, el navegador está aplicando medidas de privacidad que pueden afectar el CDN (cdnjs). Para asegurar carga fiable de Three.js:

1. Descarga `three.min.js` (la misma versión, p.ej. r128) y colócala en `public/js/three.min.js`.
2. El script ya intenta cargar desde CDN y, si falla, intentará `/js/three.min.js` automáticamente.
3. Comprueba la consola del navegador para mensajes: `three.js desde CDN cargado.` o `three.js local cargado.`

Si quieres, puedo añadir `three.min.js` al repo por ti o cambiar la integración para usar `import 'three'` desde npm y un componente cliente (recomendado para producción).

**Comportamiento de la UI:** La demo ahora reproduce automáticamente una breve animación de entrada y carga Three.js en segundo plano. Si la carga es lenta, aparecerá un botón **"Cargar ahora"** en la superposición para forzar la carga manualmente; también puedes cancelar la carga.

**Conducción épica (prototipo):** En pantallas de escritorio aparece un panel a la izquierda con **ubicaciones** (Skills, Experiencia, Proyectos, Contacto y Redes sociales). Al hacer clic en una ubicación se inicia una conducción cinematográfica y breve hacia ese punto; la animación es interrumpible (Esc o botón Cancelar), respeta `prefers-reduced-motion` (salto instantáneo) y, al llegar, se ofrece la opción de continuar a la siguiente parada hasta terminar en el centro de redes sociales.
