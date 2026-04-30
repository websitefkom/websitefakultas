#!/usr/bin/env node
/**
 * Migration script
 *  - Finds documents in `prodi` collection whose _id is an ObjectId
 *  - Generates a new custom _id `PGS-FKOM-XX` (with suffixes on collision)
 *  - Inserts a new document with the new _id copying fields and mapping legacy dokumen fields
 *  - Backs up the original document into `prodi_legacy_backup` with legacy_id and metadata
 *  - Deletes the original document from `prodi`
 *
 * Usage:
 *  NODE_ENV=production MONGODB_URI="..." node ./scripts/migrate-prodi-ids.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI in environment');
  process.exit(1);
}

function generateAbbreviation(name) {
  if (!name || typeof name !== 'string') return 'PG';
  const cleaned = name.replace(/[()\[\]{}.,:/\\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length === 0) return 'PG';
  const initials = words.map((w) => w[0].toUpperCase()).join('');
  if (initials.length >= 2) return initials.slice(0, 3);
  return words[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
}

async function buildUniqueProdiId(collection, name) {
  const abbr = generateAbbreviation(name);
  const base = `PGS-FKOM-${abbr}`;
  let candidate = base;
  let i = 0;
  while (true) {
    // check existence
    // eslint-disable-next-line no-await-in-loop
    const exists = await collection.findOne({ _id: candidate });
    if (!exists) return candidate;
    i += 1;
    candidate = `${base}-${i}`;
    if (i > 9999) throw new Error('Unable to generate unique Prodi ID');
  }
}

async function run() {
  const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db('websitefkom');
  const collection = db.collection('prodi');
  const backup = db.collection('prodi_legacy_backup');

  // Find documents whose _id is ObjectId (legacy)
  const cursor = collection.find({ _id: { $type: 'objectId' } });
  let migrated = 0;

  const preview = [];
  const mapping = [];

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    try {
      const legacyId = doc._id;
      const name = doc.nama || String(legacyId);
      const newId = await buildUniqueProdiId(collection, name);

      // Prepare new document copying known fields and mapping legacy keys
      const newDoc = {
        _id: newId,
        nama: doc.nama,
        deskripsi: doc.deskripsi,
        gambar: doc.gambar || null,
        visi: doc.visi || null,
        misi: Array.isArray(doc.misi) ? doc.misi : (doc.misi ? [doc.misi] : []),
        akreditasi: doc.akreditasi || '',
        tahun_akreditasi: doc.tahun_akreditasi || null,
        dokumenAkreditasi: doc.dokumenUrl_akreditasi || doc.dokumenAkreditasi || null,
        dokumenName_akreditasi: doc.dokumenName_akreditasi || null,
        thumbnailAkreditasi: doc.thumbnailAkreditasi || null,
        createdAt: doc.createdAt || new Date(),
        updatedAt: doc.updatedAt || new Date(),
      };

      preview.push({ legacy_id: legacyId.toString(), newDoc });
      mapping.push({ legacy_id: legacyId.toString(), new_id: newId });

      if (!DRY_RUN) {
        // Insert the new document with the string _id
        await collection.insertOne(newDoc);

        // Backup original doc
        await backup.insertOne({ legacy_id: legacyId, data: doc, migrated_to: newId, migratedAt: new Date() });

        // Delete legacy doc
        await collection.deleteOne({ _id: legacyId });

        console.log(`Migrated ${legacyId.toString()} -> ${newId}`);
        migrated += 1;
      } else {
        console.log(`[dry-run] Preview would migrate ${legacyId.toString()} -> ${newId}`);
      }
    } catch (err) {
      console.error('Failed to migrate a document:', err.message);
    }
  }

  // Write preview and mapping files when dry-run requested
  if (DRY_RUN) {
    const fs = require('fs');
    const path = require('path');
    const outDir = path.resolve(process.cwd(), 'migration_preview');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
    fs.writeFileSync(path.join(outDir, 'prodi_migration_preview.json'), JSON.stringify(preview, null, 2));
    fs.writeFileSync(path.join(outDir, 'prodi_migration_mapping.json'), JSON.stringify(mapping, null, 2));
    console.log(`Dry-run complete. Preview files written to ${outDir}`);
  }

  console.log(`Migration completed. Documents migrated: ${migrated}`);
  await client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
