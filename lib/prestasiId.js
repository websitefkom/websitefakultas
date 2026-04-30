import { getNextSequence } from '@/models/Counter';

function roleCode(role) {
  if (!role) return 'M';
  const r = role.toLowerCase();
  return r === 'dosen' ? 'D' : 'M';
}

function tingkatCode(tingkat) {
  if (!tingkat) return 'N';
  const t = tingkat.toLowerCase();
  if (t.includes('nasional')) return 'N';
  if (t.includes('universitas')) return 'U';
  if (t.includes('internasional')) return 'I';
  if (t.includes('provinsi')) return 'P';
  return 'N';
}

function formatDateYYMMDD(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function formatId(role, tingkat, tanggal, seq) {
  const dateCode = formatDateYYMMDD(tanggal) || formatDateYYMMDD(new Date());
  const rCode = roleCode(role);
  const tCode = tingkatCode(tingkat);
  const seqStr = String(seq).padStart(3, '0');
  return `PRE-${rCode}-${tCode}-${dateCode}-${seqStr}`;
}

export async function generateId(role, tingkat, tanggal) {
  const dateCode = formatDateYYMMDD(tanggal) || formatDateYYMMDD(new Date());
  const counterName = `prestasi_${dateCode}`;
  const seq = await getNextSequence(counterName);
  return formatId(role, tingkat, tanggal, seq);
}

export default { formatId, generateId };
