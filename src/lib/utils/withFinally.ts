export async function withFinally<T>(action: () => Promise<T>, cleanup: () => void): Promise<T> {
  try {
    return await action();
  } finally {
    cleanup();
  }
}
