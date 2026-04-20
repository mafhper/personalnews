const DB_NAME = 'personalnews-background-images';
const STORE_NAME = 'backgrounds';
const DB_VERSION = 1;

export const DEFAULT_BACKGROUND_IMAGE_ID = 'uploaded-background';
export const STORED_BACKGROUND_IMAGE_PREFIX = 'indexeddb:';

type StoredBackgroundImage = {
  id: string;
  dataUrl: string;
  updatedAt: number;
};

const hasIndexedDB = (): boolean =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openBackgroundImageDatabase = (): Promise<IDBDatabase> => {
  if (!hasIndexedDB()) {
    return Promise.reject(new Error('IndexedDB is not available'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open background image database'));
    };
  });
};

export const createStoredBackgroundImageRef = (
  id = DEFAULT_BACKGROUND_IMAGE_ID,
): string => `${STORED_BACKGROUND_IMAGE_PREFIX}${id}`;

export const isStoredBackgroundImageRef = (value?: string | null): boolean =>
  Boolean(value?.startsWith(STORED_BACKGROUND_IMAGE_PREFIX));

export const parseStoredBackgroundImageRef = (
  value?: string | null,
): string | null => {
  if (!isStoredBackgroundImageRef(value)) return null;
  const id = value?.slice(STORED_BACKGROUND_IMAGE_PREFIX.length).trim();
  return id || null;
};

export const saveBackgroundImage = async (
  dataUrl: string,
  id = DEFAULT_BACKGROUND_IMAGE_ID,
): Promise<string> => {
  const db = await openBackgroundImageDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put({ id, dataUrl, updatedAt: Date.now() } satisfies StoredBackgroundImage);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Failed to save background image'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Background image save was aborted'));
      };
    });
  } finally {
    db.close();
  }

  return createStoredBackgroundImageRef(id);
};

export const loadBackgroundImage = async (id: string): Promise<string | null> => {
  const db = await openBackgroundImageDatabase();

  try {
    return await new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredBackgroundImage | undefined;
        resolve(result?.dataUrl ?? null);
      };
      request.onerror = () => {
        reject(request.error ?? new Error('Failed to load background image'));
      };
    });
  } finally {
    db.close();
  }
};

export const removeBackgroundImage = async (
  id = DEFAULT_BACKGROUND_IMAGE_ID,
): Promise<void> => {
  if (!hasIndexedDB()) return;

  const db = await openBackgroundImageDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Failed to remove background image'));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Background image removal was aborted'));
      };
    });
  } finally {
    db.close();
  }
};
