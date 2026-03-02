# Produtos-Mercado-Livre

Aplicação web para formatar mensagens de promoções a partir de um link de produto do Mercado Livre, usando a API oficial do Mercado Livre.

## Como instalar

Requisitos: **Node.js 18+** e **npm**.

```bash
# Clone o repositório
git clone https://github.com/BrunaCPS/Produtos-Mercado-Livre.git
cd Produtos-Mercado-Livre

# Instale as dependências
npm install
```

## Como rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Como usar

1. Cole o link de um produto do Mercado Livre no campo de entrada (ex.: `https://www.mercadolivre.com.br/produto/MLB1234567890-...`).
2. Clique em **Buscar**.
3. A aplicação exibirá:
   - Imagem do produto
   - Título
   - Preço atual e preço original (quando disponível)
   - Percentual de desconto (quando aplicável)
   - Texto formatado da promoção pronto para compartilhar
4. Clique em **Copiar texto** para copiar a mensagem para a área de transferência.

### Exemplo de texto gerado (com desconto)

```
Produto Incrível XYZ

💸 DE: R$ 99,90
🏷 DESCONTO: 30% OFF
💥 POR: R$ 69,93

🛒 Mercado Livre:
https://www.mercadolivre.com.br/...
```

### Exemplo de texto gerado (sem desconto)

```
Produto Incrível XYZ

💥 POR: R$ 69,93

🛒 Mercado Livre:
https://www.mercadolivre.com.br/...
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run lint` | Executa o linter |
