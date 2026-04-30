#!/usr/bin/env node
/**
 * Destructive migration (safe by default):
 * - For each document in `tautan` whose `_id` is an ObjectId, create a new document
 *   with `_id` set to the TAUT-### code (generated or existing in `code` field),
 *   copy fields and add `oldObjectId` to preserve the original id.
 * - Delete the original ObjectId document after successful insert.
 *
 * IMPORTANT: this will change `_id` values — other collections referencing the
 * old ObjectId will break. Run in dry-run mode to preview changes, then run
 * with `--confirm` to perform.
 *
 * Usage (dry-run):
 *   node scripts/migrate-tautan-id-to-code.js
 * To apply changes:
 *   node scripts/migrate-tautan-id-to-code.js --confirm
 *
 */

require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'websitefkom'
const confirm = process.argv.includes('--confirm') || process.env.CONFIRM === '1'

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

    // compute starting number from existing codes (in code field or string _id)
    const docsWithCode = await col.find({ $or: [ { code: { $exists: true } }, { _id: { $type: 'string' } } ] }).project({ code: 1, _id: 1 }).toArray()
    const nums = docsWithCode.map(d => {
      if (d.code) return parseCodeNumber(d.code)
      return parseCodeNumber(d._id)
    }).filter(n => !isNaN(n))
    let next = nums.length ? Math.max(...nums) + 1 : 1

    // find documents with ObjectId _id
    const cursor = col.find({ _id: { $type: 'objectId' } }).sort({ createdAt: 1 })

    let planned = []
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      let code = doc.code
      if (!code) {
        code = formatCode(next)
        next++
      }

      planned.push({ oldId: doc._id, code, doc })
    }

    if (planned.length === 0) {
      console.log('Tidak ada _id ObjectId yang perlu diubah.')
      await client.close()
      process.exit(0)
    }

    console.log(`Found ${planned.length} documents to migrate.`)
    for (const p of planned) {
      const { oldId, code, doc } = p

      const exists = await col.findOne({ _id: code })
      if (exists) {
        console.warn(`Conflict: target _id=${code} already exists, skipping old _id=${oldId.toString()}`)
        continue
      }

      console.log(`Will migrate _id=${oldId.toString()} -> _id=${code}`)
      if (!confirm) continue

      // prepare new document: copy fields but set _id to code and record oldObjectId
      const newDoc = { ...doc }
      newDoc._id = code
      newDoc.oldObjectId = oldId

      // ensure createdAt/updatedAt preserved; if code field missing, set it
      if (!newDoc.code) newDoc.code = code

      // insert new document and delete old one
      await col.insertOne(newDoc)
      await col.deleteOne({ _id: oldId })
      console.log(`Migrated: ${oldId.toString()} -> ${code}`)
    }

    if (!confirm) {
      console.log('\nDry-run complete. No changes performed. Re-run with `--confirm` to apply.')
    } else {
      console.log('\nMigration applied. Verify application references and related collections.')
    }

    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    try { await client.close() } catch (e) {}
    process.exit(1)
  }
})()
