/**
 * Generates PNG app icons (all PWA / Android sizes), a maskable icon and a splash
 * image from public/favicon.svg. Run with: npm run icons
 */
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg', 'utf8')
const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

function render(source: string, width: number, out: string) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: width } }).render().asPng()
  writeFileSync(out, png)
}

mkdirSync('public/icons', { recursive: true })
mkdirSync('resources', { recursive: true })

for (const size of [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]) {
  render(svg, size, `public/icons/icon-${size}.png`)
}
render(svg, 180, 'public/icons/apple-touch-icon.png')

// Maskable: full-bleed background, artwork inside the 80% safe zone.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#B4532A"/>
<g transform="translate(51.2 51.2) scale(0.8)">${inner.replace(/<rect[^>]*\/>/, '')}</g></svg>`
render(maskable, 512, 'public/icons/maskable-512.png')
render(maskable, 1024, 'resources/icon-only.png')

// Splash (Capacitor-ready 2732x2732): cream background with centered icon.
const splash = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
<rect width="2732" height="2732" fill="#FBF5EA"/>
<g transform="translate(1066 1066) scale(1.171875)">${inner}</g></svg>`
render(splash, 2732, 'resources/splash.png')
const splashDark = splash.replace('#FBF5EA"/>', '#1E1915"/>')
render(splashDark, 2732, 'resources/splash-dark.png')

console.log('icons + splash generated')
