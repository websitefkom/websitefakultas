#!/usr/bin/env node
const dbConnect = require('../lib/mongoose').default || require('../lib/mongoose');
const Prestasi = require('../models/Prestasi').default || require('../models/Prestasi');

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/check-prestasi.js <_id>');
    process.exit(1);
  }
  try {
    await dbConnect();
    const doc = await Prestasi.findById(id).lean();
    if (!doc) {
      console.log('Not found for id=', id);
      process.exit(0);
    }
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying Prestasi:', err);
    process.exit(2);
  }
}

main();
