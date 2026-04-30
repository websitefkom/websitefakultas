#!/usr/bin/env node
/**
 * Generic script to add readable codes to a collection and optional nested array fields.
 * Usage examples:
 *  - Add codes to top-level documents:
 *      node scripts/add-codes-to-collection.js --collection peraturan --prefix PRT
 *  - Also add codes to embedded array elements:
 *      node scripts/add-codes-to-collection.js --collection peraturan --prefix PRT --arrayField dokumen --arrayPrefix DOC
 *
 * Options:
 *  --collection <name>    : (required) collection name
 *  --prefix <PREFIX>      : (required) prefix for top-level codes, e.g. PRT
 *  --arrayField <name>    : (optional) name of array field to process (single)
 *  --arrayPrefix <PREFIX> : (optional) prefix for codes of array elements
 *  --confirm              : apply changes (dry-run default)
 */

require('dotenv').config()
const { MongoClient, ObjectId } = require('mongodb')
const argv = require('minimist')(process.argv.slice(2))

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const dbName = process.env.MONGODB_DB || 'websitefkom'
const collectionName = argv.collection
const prefix = argv.prefix
const arrayField = argv.arrayField
const arrayPrefix = argv.arrayPrefix || (arrayField ? `${prefix}-ITEM` : null)
const confirm = argv.confirm || false

if (!collectionName || !prefix) {
  console.error('Missing required args: --collection and --prefix')
  process.exit(1)
}

function parseCodeNumber(code, pref) {
  const m = String(code || '').match(new RegExp(`${pref}-(\\d+)`))
  return m ? parseInt(m[1], 10) : 0
}

function formatCode(n, pref) {
  return `${pref}-${String(n).padStart(3, '0')}`
}

;(async () => {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  try {
    await client.connect()
    const db = client.db(dbName)
    const col = db.collection(collectionName)

    console.log(`Collection: ${collectionName}`)

    // Determine next number for top-level docs
    const docsWithCode = await col.find({ code: { $exists: true } }).project({ code: 1 }).toArray()
    const nums = docsWithCode.map(d => parseCodeNumber(d.code, prefix)).filter(n => !isNaN(n))
    let next = nums.length ? Math.max(...nums) + 1 : 1

    // Process top-level documents without code
    const cursor = col.find({ code: { $exists: false } }).sort({ createdAt: 1 })
    let topUpdated = 0
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      const code = formatCode(next, prefix)
      console.log(`[Top] _id=${doc._id.toString()} -> code=${code}`)
      if (confirm) {
        await col.updateOne({ _id: doc._id }, { $set: { code, updatedAt: new Date() } })
      }
      next++
      topUpdated++
    }

    // Process embedded array elements if requested
    let arrUpdated = 0
    if (arrayField) {
      // Determine next number for array elements based on existing codes
      const samples = await col.find({ [`${arrayField}.code`]: { $exists: true } }).project({ [`${arrayField}.code`]: 1 }).toArray()
      const arrNums = []
      samples.forEach(s => {
        const arr = s[arrayField] || []
        arr.forEach(el => { if (el && el.code) arrNums.push(parseCodeNumber(el.code, arrayPrefix)) })
      })
      let nextArr = arrNums.length ? Math.max(...arrNums) + 1 : 1

      // Iterate documents with arrayField
      const docCursor = col.find({ [arrayField]: { $exists: true, $ne: [] } }).sort({ createdAt: 1 })
      while (await docCursor.hasNext()) {
        const doc = await docCursor.next()
        const arr = doc[arrayField] || []
        let modified = false
        for (let i = 0; i < arr.length; i++) {
          const el = arr[i]
          if (!el) continue
          if (!el.code) {
            const code = formatCode(nextArr, arrayPrefix)
            console.log(`[Embedded] doc _id=${doc._id.toString()} ${arrayField}[${i}] -> code=${code}`)
            if (confirm) {
              // update single array element by index
              const path = `${arrayField}.${i}.code`
              await col.updateOne({ _id: doc._id }, { $set: { [path]: code, updatedAt: new Date() } })
            }
            nextArr++
            arrUpdated++
            modified = true
          }
        }
        // optional: if modified and not confirm, do nothing in dry-run
      }
    }

    console.log(`\nDry-run: top-level to-add=${topUpdated}, embedded to-add=${arrUpdated}`)
    if (!confirm) console.log('Re-run with --confirm to apply changes.')
    else console.log('Changes applied.')

    await client.close()
    process.exit(0)
  } catch (err) {
    console.error('Failed:', err)
    try { await client.close() } catch (e) {}
    process.exit(1)
  }
})()
