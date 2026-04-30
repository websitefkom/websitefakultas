import assert from 'assert';
import { formatId } from './prestasiId';

function testFormatId() {
  const id = formatId('mahasiswa', 'Nasional', '2025-05-17', 1);
  assert.strictEqual(id, 'PRE-M-N-250517-001');
  const id2 = formatId('dosen', 'Internasional', '2025-08-10', 2);
  assert.strictEqual(id2, 'PRE-D-I-250810-002');
  console.log('prestasiId.formatId tests passed');
}

testFormatId();
