#!/usr/bin/env node

/**
 * Script para generar modpack.json automáticamente a partir de una carpeta local de archivos.
 *
 * Uso:
 *   node scripts/generate-modpack.js [directorio] [cdnBaseUrl] [salida]
 *
 * Ejemplos:
 *   node scripts/generate-modpack.js ./mis-mods https://cdn.dominiocraft.com/archivos
 *   node scripts/generate-modpack.js ./mods https://cdn.dominiocraft.com ./dist-cdn/modpack.json
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const inputDir = process.argv[2] || './modpack-files'
const cdnBase = (process.argv[3] || 'https://cdn.tudominio.com').replace(/\/+$/, '')
const outputFile = process.argv[4] || './modpack.json'

function getFileSha1(filePath) {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash('sha1').update(buffer).digest('hex')
}

function getFileType(fileName, relativeDir) {
  const ext = path.extname(fileName).toLowerCase()
  if (relativeDir.startsWith('shaderpacks')) return 'SHADERPACK'
  if (relativeDir.startsWith('resourcepacks')) return 'RESOURCEPACK'
  if (relativeDir.startsWith('mods') || ext === '.jar') return 'MOD'
  if (
    relativeDir.startsWith('config') ||
    ['.json', '.toml', '.txt', '.yaml', '.yml', '.properties', '.cfg', '.ini'].includes(ext)
  ) {
    return 'CONFIG'
  }
  return 'OTHER'
}

function scanDirectory(dir, baseDir = dir) {
  let results = []
  if (!fs.existsSync(dir)) return results

  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, baseDir))
    } else if (item.isFile()) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
      const dirName = path.dirname(relativePath)
      const pathFormatted = dirName === '.' ? '' : `${dirName}/`

      const stats = fs.statSync(fullPath)
      const sha1 = getFileSha1(fullPath)

      results.push({
        name: item.name,
        path: pathFormatted,
        url: `${cdnBase}/${pathFormatted}${item.name}`,
        sha1: sha1,
        size: stats.size,
        type: getFileType(item.name, pathFormatted)
      })
    }
  }

  return results
}

console.log('--- Generador de Modpack Manifest para Dominio Launcher ---')
console.log(`Directorio origen : ${inputDir}`)
console.log(`Base URL CDN      : ${cdnBase}`)
console.log(`Archivo de salida : ${outputFile}`)

if (!fs.existsSync(inputDir)) {
  console.log(`\nLa carpeta "${inputDir}" no existe aún.`)
  console.log(`Puedes crear la carpeta "${inputDir}", colocar tus mods dentro (ej: ${inputDir}/mods/...) y volver a ejecutar este script.`)
  process.exit(0)
}

const files = scanDirectory(inputDir)

if (files.length === 0) {
  console.log(`\nNo se encontraron archivos en "${inputDir}".`)
  process.exit(0)
}

const manifest = {
  files: files
}

fs.writeFileSync(outputFile, JSON.stringify(manifest, null, 2), 'utf-8')

console.log(`\n¡Éxito! Se indexaron ${files.length} archivos en "${outputFile}".`)
console.log('Ahora puedes subir estos archivos y el modpack.json a tu CDN.')
