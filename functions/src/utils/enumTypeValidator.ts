export function isEnumValue<T>(enm: Record<string, T>, value?: unknown): value is T {
  return typeof value === "string" && (Object.values(enm) as unknown as string[]).includes(value);
}

export function parseEnumOrThrow<T>(enm: Record<string, T>, value?: unknown, name = "enum"): T {
  if (isEnumValue<T>(enm, value)) return value as T;
  throw new Error(`Valor inválido para ${name}: ${String(value)}`);
}