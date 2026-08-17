export function payloadErrors(
  result: { error?: unknown },
  errors: readonly { message: string }[] | null | undefined,
): string[] | undefined {
  if (result.error) return ['Une erreur est survenue.'];
  const messages = errors?.map((error) => error.message) ?? [];
  return messages.length > 0 ? messages : undefined;
}
