#!/usr/bin/env node
const sharp = require('sharp')
const glob = require('glob')
const path = require('path')
const fs = require('fs')

const PATTERN = 'public/**/*.+(jpg|jpeg|png)'
const QUALITY = 80
const PLACEHOLDER_WIDTH = 20

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

glob(PATTERN, { nodir: true }, async (err, files) => {
  if (err) {
    console.error('Glob error', err)
    process.exit(1)
  }

  for (const file of files) {
    try {
      const ext = path.extname(file)
      const base = file.slice(0, -ext.length)
      const outWebp = base + '.webp'
      const placeholder = base + '.placeholder.webp'

      ensureDirExists(outWebp)

      if (!fs.existsSync(outWebp)) {
        await sharp(file).webp({ quality: QUALITY }).toFile(outWebp)
        console.log('✅ Created', outWebp)
      } else {
        console.log('ℹ️ Exists', outWebp)
      }

      // Create a small blurred placeholder for LQIP usage
      await sharp(file)
        .resize({ width: PLACEHOLDER_WIDTH })
        .blur(1)
        .webp({ quality: 30 })
        .toFile(placeholder)
      console.log('✅ Created placeholder', placeholder)
    } catch (e) {
      console.warn('⚠️ Failed to optimize', file, e?.message || e)
    }
  }

  console.log('🎉 Image optimization complete')
})

