// O allowlist do backend e uma COPIA dos numeros de `ports.mjs`.
//
// O backend roda em Node puro e nao importa `ports.mjs` (o `tsconfig` dele tem
// `rootDir` proprio, e atravessar a fronteira seria acoplamento). Entao a lista
// e repetida como dado — e este teste e o que garante que as duas copias nao
// divirjam.
//
// Sem ele, trocar a porta no `ports.mjs` produz um backend que **rejeita o
// proprio app**: o Vite sobe, o fetch leva 403/CSRF, e o sintoma e "o app nao
// fala com o backend" — sem nenhuma mensagem sobre porta.
//
// Roda com `bun vitest` (o resto da suite deste projeto), nao com `node --test`.

import { afterEach, describe, expect, it, vi } from "vitest";

import { isAllowedBackendOrigin } from "../apps/backend/src/httpSecurity";
import {
  BACKEND_ORIGINS,
  DEV_ORIGINS,
  DEV_PORT,
  PREVIEW_ORIGINS,
  PREVIEW_PORT,
  TAURI_ORIGINS,
} from "../ports.mjs";

describe("portas do backend x ports.mjs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("a porta nomeada do dev e aceita", () => {
    expect(DEV_PORT).toBe(5290);
    expect(isAllowedBackendOrigin(`http://localhost:${DEV_PORT}`)).toBe(true);
    expect(isAllowedBackendOrigin(`http://127.0.0.1:${DEV_PORT}`)).toBe(true);
  });

  it("a porta nomeada do preview e aceita", () => {
    expect(PREVIEW_PORT).toBe(4290);
    expect(isAllowedBackendOrigin(`http://localhost:${PREVIEW_PORT}`)).toBe(true);
    expect(isAllowedBackendOrigin(`http://127.0.0.1:${PREVIEW_PORT}`)).toBe(true);
  });

  it("as portas do Vite NAO sao mais aceitas", () => {
    // O teste que reprovaria a solucao pela metade: se o allowlist ainda
    // aceitasse 5173, nomear a porta seria decorativo.
    expect(isAllowedBackendOrigin("http://localhost:5173")).toBe(false);
    expect(isAllowedBackendOrigin("http://127.0.0.1:5173")).toBe(false);
    expect(isAllowedBackendOrigin("http://localhost:4175")).toBe(false);
  });

  it("loopback em porta qualquer e recusado", () => {
    // A faixa antiga (5173-5190) aceitava QUALQUER loopback nela. Conjunto
    // explicito recusa — e e isso que a CSRF precisa.
    expect(isAllowedBackendOrigin("http://localhost:5999")).toBe(false);
    expect(isAllowedBackendOrigin("http://evil.example")).toBe(false);
  });

  it("as origens do Tauri continuam aceitas, e nao tem porta", () => {
    for (const origem of TAURI_ORIGINS) {
      expect(isAllowedBackendOrigin(origem), `${origem} deveria ser aceita`).toBe(true);
    }
  });

  it("as listas de ports.mjs nao se sobrepoem", () => {
    expect(DEV_ORIGINS).toHaveLength(2);
    expect(PREVIEW_ORIGINS).toHaveLength(2);
    expect(BACKEND_ORIGINS).toHaveLength(2);
    expect(TAURI_ORIGINS).toHaveLength(3);
    const todas = [...DEV_ORIGINS, ...PREVIEW_ORIGINS, ...BACKEND_ORIGINS, ...TAURI_ORIGINS];
    expect(new Set(todas).size).toBe(todas.length);
  });

  it("BACKEND_ALLOWED_ORIGINS ADICIONA origem, e nao apaga o fallback", () => {
    // Correcao de um teste anterior deste arquivo, que afirmava que o env
    // "sobrescreve tudo". Ele estava errado: se apagar a faixa vizinha, o
    // `run-local-stack` deixa de funcionar quando a porta preferida esta
    // ocupada — e e exatamente para isso que a faixa existe. O env e um
    // acrescimo (origem extra confiavel), nao uma substituicao.
    vi.stubEnv("BACKEND_ALLOWED_ORIGINS", "http://localhost:1234");
    expect(isAllowedBackendOrigin("http://localhost:1234")).toBe(true);
    // a porta nomeada continua aceita (fallback preservado)
    expect(isAllowedBackendOrigin(`http://localhost:${DEV_PORT}`)).toBe(true);
  });
});