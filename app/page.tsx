"use client";

import Image from "next/image";
import { useState } from "react";

interface ProductData {
  title: string;
  price: number;
  original_price: number | null;
  permalink: string;
  thumbnail: string | null;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcDiscount(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function buildMessage(product: ProductData): string {
  const atual = formatBRL(product.price);
  const link = product.permalink;

  if (product.original_price) {
    const original = formatBRL(product.original_price);
    const percent = calcDiscount(product.original_price, product.price);
    return `${product.title}\n\n💸 DE: R$ ${original}\n🏷 DESCONTO: ${percent}% OFF\n💥 POR: R$ ${atual}\n\n🛒 Mercado Livre:\n${link}`;
  }

  return `${product.title}\n\n💥 POR: R$ ${atual}\n\n🛒 Mercado Livre:\n${link}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setProduct(null);
    setCopied(false);

    try {
      const res = await fetch(`/api/product?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erro desconhecido.");
      } else {
        setProduct(json as ProductData);
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!product) return;
    await navigator.clipboard.writeText(buildMessage(product));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const message = product ? buildMessage(product) : "";

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center py-12 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-yellow-500">🛒 Promoções Mercado Livre</h1>
        <p className="text-zinc-600 mt-2">Cole um link de produto e gere o texto da promoção automaticamente.</p>
      </header>

      <form onSubmit={handleSearch} className="w-full max-w-xl flex gap-2 mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.mercadolivre.com.br/produto/MLB..."
          required
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-zinc-900 hover:bg-yellow-500 disabled:opacity-60 transition-colors"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && (
        <div className="w-full max-w-xl rounded-lg bg-red-100 border border-red-300 text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {product && (
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4">
          {product.thumbnail && (
            <div className="flex justify-center">
              <Image
                src={product.thumbnail}
                alt={product.title}
                width={200}
                height={200}
                className="object-contain rounded-lg max-h-48 w-auto"
                unoptimized
              />
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Título</p>
            <p className="text-zinc-800 font-medium">{product.title}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {product.original_price && (
              <div>
                <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Preço original</p>
                <p className="text-zinc-500 line-through">R$ {formatBRL(product.original_price)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Preço atual</p>
              <p className="text-green-600 font-bold text-xl">R$ {formatBRL(product.price)}</p>
            </div>
            {product.original_price && (
              <div>
                <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Desconto</p>
                <p className="text-red-500 font-bold">
                  {Math.round(calcDiscount(product.original_price, product.price))}% OFF
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Texto da promoção</p>
            <textarea
              readOnly
              value={message}
              rows={message.split("\n").length + 1}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 resize-none focus:outline-none"
            />
          </div>

          <button
            onClick={handleCopy}
            className="rounded-lg bg-zinc-800 px-6 py-3 font-semibold text-white hover:bg-zinc-700 transition-colors"
          >
            {copied ? "✅ Copiado!" : "Copiar texto"}
          </button>
        </div>
      )}
    </div>
  );
}
