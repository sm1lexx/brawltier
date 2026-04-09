import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = (searchParams.get('tag') || '').trim().toUpperCase();

  if (!tag) return NextResponse.json({ error: 'No tag' }, { status: 400 });

  const clean = tag.startsWith('#') ? tag.slice(1) : tag;
  const url = `https://api.brawlstars.com/v1/players/%23${encodeURIComponent(clean)}`;

  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BRAWL_API_TOKEN}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const data = await r.json();
  if (!r.ok) return NextResponse.json(data, { status: r.status });

  return NextResponse.json(data);
}