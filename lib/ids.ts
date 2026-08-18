function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateShortId(): string {
  return randomHex(6);
}

export function generateToken(): string {
  return randomHex(32);
}
