#!/usr/bin/env node
/**
 * Skrip migrasi: menambahkan field `code` ke koleksi `tautan`
 * Format: TAUT-001, TAUT-002, ...
 * Usage:
 *   MONGODB_URI="..." MONGODB_DB="websitefkom" node scripts/migrate-tautan-codes.js
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'websitefkom'

function parseCodeNumber(code) {
  const m = String(code || '').match(/TAUT-(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

function formatCode(n) {
  return `TAUT-${String(n).padStart(3, '0')}`
}

;(async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection('tautan')

    // cari nilai tertinggi dari kode yang sudah ada
    const docsWithCode = await col.find({ code: { $exists: true } }).project({ code: 1 }).toArray()
    const nums = docsWithCode.map(d => parseCodeNumber(d.code)).filter(n => !isNaN(n))
    let next = nums.length ? Math.max(...nums) + 1 : 1

    // ambil dokumen yang belum punya code, urut berdasarkan createdAt agar deterministik
    const cursor = col.find({ code: { $exists: false } }).sort({ createdAt: 1 })

    let updatedCount = 0
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      const code = formatCode(next)
      await col.updateOne({ _id: doc._id }, { $set: { code, updatedAt: new Date() } })
      console.log(`Updated _id=${doc._id.toString()} -> code=${code}`)
      next++
      updatedCount++
    }

    if (updatedCount === 0) {
      console.log('Tidak ada dokumen yang perlu dimigrasi.')
    } else {
      console.log(`Selesai. ${updatedCount} dokumen diperbarui.`)
    }

    // optional: ensure unique index on code
    // await col.createIndex({ code: 1 }, { unique: true, sparse: true })

    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('Migrasi gagal:', err)
    try { await client.close() } catch (e) {}
    process.exit(1)
  }
})()
