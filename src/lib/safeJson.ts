/** Lê JSON de Response sem quebrar se o corpo vier vazio (timeout/proxy). */
export async function readJsonSafe<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(
      res.ok
        ? "Servidor respondeu vazio (possível timeout). Tente de novo."
        : `Erro HTTP ${res.status}: resposta vazia do servidor (timeout comum no Render em operações longas).`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Resposta inválida do servidor (HTTP ${res.status}): ${text.slice(0, 180)}`
    );
  }
}
