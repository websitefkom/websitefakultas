export async function POST() {
  // Compatibility helper for clients calling /api/auth/logout
  // NextAuth expects /api/auth/signout — return JSON pointing to that.
  return new Response(JSON.stringify({ ok: true, signout: '/api/auth/signout' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function GET() {
  // Redirect browsers to NextAuth signout page
  return new Response(null, { status: 307, headers: { Location: '/api/auth/signout' } })
}
