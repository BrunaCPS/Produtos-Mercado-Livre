import { NextRequest, NextResponse } from "next/server";

interface MLPicture {
  url?: string;
}

interface MLItem {
  title: unknown;
  price: unknown;
  original_price: unknown;
  permalink: unknown;
  thumbnail?: unknown;
  pictures?: MLPicture[];
}

function extractItemId(url: string): string | null {
  // Match MLB-123... or MLB123... patterns
  const match = url.match(/MLB-?(\d+)/i);
  if (!match) return null;
  return `MLB${match[1]}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productUrl = searchParams.get("url");

  if (!productUrl) {
    return NextResponse.json(
      { error: "URL do produto é obrigatória." },
      { status: 400 }
    );
  }

  const itemId = extractItemId(productUrl);
  if (!itemId) {
    return NextResponse.json(
      { error: "URL inválida. Não foi possível extrair o código do produto (ex.: MLB1234567890)." },
      { status: 400 }
    );
  }

  let data: MLItem;
  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; produtos-ml/1.0)",
      },
      next: { revalidate: 0 },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Produto não encontrado. Verifique o link e tente novamente." },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Falha ao consultar a API do Mercado Livre (status ${response.status}).` },
        { status: 502 }
      );
    }

    data = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar à API do Mercado Livre. Tente novamente mais tarde." },
      { status: 502 }
    );
  }

  const pictures = Array.isArray(data.pictures) ? data.pictures : [];
  const firstPictureUrl = pictures[0]?.url ?? null;

  return NextResponse.json({
    title: data.title,
    price: data.price,
    original_price: data.original_price ?? null,
    permalink: data.permalink,
    thumbnail: firstPictureUrl ?? data.thumbnail ?? null,
  });
}
