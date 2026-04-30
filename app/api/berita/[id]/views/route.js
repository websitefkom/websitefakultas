import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongoose'
import Berita from '@/models/Berita'
import mongoose from 'mongoose'

// Increment views (POST) and read views (GET) for a berita identified by dynamic [id]
// Note: `context` must be awaited to unwrap `params` in Next.js App Router.

export async function POST(request, context) {
	try {
		// `context.params` may be a Promise in some Next.js runtimes.
		const rawParams = context && context.params
		const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
		const id = params?.id
		if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 })

		await dbConnect()
		// debug log when POST received
		// eslint-disable-next-line no-console
		console.log('[views] POST received for id=', id)

		let updated = await Berita.findOneAndUpdate({ _id: id }, { $inc: { views: 1 } }, { new: true }).lean().catch(() => null)
		// If not found by custom _id, try ObjectId and then try slug
		if (!updated && /^[0-9a-fA-F]{24}$/.test(id)) {
			// try as ObjectId
			try {
				updated = await Berita.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id) }, { $inc: { views: 1 } }, { new: true }).lean()
			} catch (e) {
				updated = null
			}
		}

		if (!updated) {
			// try by slug
			// eslint-disable-next-line no-console
			console.log('[views] not found by _id/ObjectId, trying slug=', id)
			updated = await Berita.findOneAndUpdate({ slug: id }, { $inc: { views: 1 } }, { new: true }).lean().catch(() => null)
		}

		if (!updated) return NextResponse.json({ success: false, message: 'Berita tidak ditemukan' }, { status: 404 })

		// eslint-disable-next-line no-console
		console.log('[views] updated (via)', updated.slug || updated._id, 'views=', updated.views)
		return NextResponse.json({ success: true, views: updated.views })
	} catch (err) {
		console.error('views increment error', err)
		return NextResponse.json({ success: false, message: err.message }, { status: 500 })
	}
}

export async function GET(request, context) {
	try {
		const rawParams = context && context.params
		const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
		const id = params?.id
		if (!id) return NextResponse.json({ success: false, message: 'ID diperlukan' }, { status: 400 })
		await dbConnect()
		let item = await Berita.findOne({ _id: id }).lean().catch(() => null)
		if (!item && /^[0-9a-fA-F]{24}$/.test(id)) {
			try {
				item = await Berita.findOne({ _id: new mongoose.Types.ObjectId(id) }).lean()
			} catch (e) {
				item = null
			}
		}
		if (!item) return NextResponse.json({ success: false, message: 'Berita tidak ditemukan' }, { status: 404 })
		return NextResponse.json({ success: true, views: item.views || 0 })
	} catch (err) {
		console.error('views get error', err)
		return NextResponse.json({ success: false, message: err.message }, { status: 500 })
	}
}

