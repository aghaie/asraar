/** کلیدِ localStorage برای توکنِ مالکیتِ یک شاخه (پس از شاخه‌زدن ذخیره می‌شود). */
export function ownerTokenKey(id: string): string {
  return `monad_owner_${id}`;
}
