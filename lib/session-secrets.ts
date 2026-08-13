/**
 * Único lugar do projeto que lê SESSION_SECRET / MASTER_SESSION_SECRET do
 * ambiente. Propositalmente sem nenhuma dependência de Node ou do Next.js
 * (`next/headers`, `next/server`, etc.) — só `process.env` e `TextEncoder`,
 * que funcionam tanto no runtime Edge do `middleware.ts` quanto no runtime
 * Node das Route Handlers (`lib/auth.ts`). Isso permite centralizar a
 * validação em um único lugar, em vez de duplicar a lógica em cada arquivo.
 *
 * Contrato: NUNCA retorna uma chave "fallback" (vazia, previsível, ou de
 * outro tipo de sessão). Ou devolve a chave real e válida, ou devolve
 * `null`. Quem chama é responsável por tratar `null` como "configuração
 * ausente" e negar a operação — nunca deve usar `null`/`''` como entrada de
 * `jwtVerify`/`SignJWT`.
 */

export type NomeSegredoSessao = 'SESSION_SECRET' | 'MASTER_SESSION_SECRET';

export function obterChaveSecreta(nome: NomeSegredoSessao): Uint8Array | null {
  const valor = process.env[nome];
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    return null;
  }
  return new TextEncoder().encode(valor);
}
