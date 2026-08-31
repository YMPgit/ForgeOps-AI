const USER_ID_KEY = 'talk-to-data-user-id';

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
}

export function scopeKey(base: string): string {
  const id = getUserId();
  return id ? `${base}-${id}` : `${base}-guest`;
}

const LEGACY_KEYS = ['talk-to-data-chats', 'talk-to-data-settings'];

export function migrateLegacyKeys(userId: string): void {
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy === null) continue;
    const scoped = `${key}-${userId}`;
    if (localStorage.getItem(scoped) === null) {
      localStorage.setItem(scoped, legacy);
    }
    localStorage.removeItem(key);
  }
}