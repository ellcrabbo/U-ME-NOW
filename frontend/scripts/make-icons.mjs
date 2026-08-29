import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const bg = '#0A0A0B'
const accent = '#FF5C38'

function svg(size, maskable) {
  const c = size / 2
  const pad = maskable ? 0 : size * 0.06
  const r = maskable ? 0 : size * 0.22
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${r}" fill="${bg}"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.36}" fill="none" stroke="${accent}" stroke-width="${size * 0.02}" opacity="0.3"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.24}" fill="none" stroke="${accent}" stroke-width="${size * 0.025}" opacity="0.55"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.12}" fill="none" stroke="${accent}" stroke-width="${size * 0.03}" opacity="0.8"/>
  <circle cx="${c}" cy="${c}" r="${size * 0.055}" fill="${accent}"/>
</svg>`
}

const jobs = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['maskable-512.png', 512, true]
]

for (const [name, size, maskable] of jobs) {
  await sharp(Buffer.from(svg(size, maskable))).png().toFile(`public/icons/${name}`)
  console.log('wrote', name)
}
