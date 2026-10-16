let idCounter = 0;

export const createId = (prefix: string): string => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) {
    return `${prefix}:${uuid}`;
  }

  idCounter += 1;

  return `${prefix}:${Date.now()}-${idCounter}`;
};
