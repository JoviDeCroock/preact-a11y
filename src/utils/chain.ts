export function chain<Arguments extends unknown[]>(
  ...callbacks: Array<((...args: Arguments) => void) | undefined>
): (...args: Arguments) => void {
  return (...args) => {
    for (const callback of callbacks) callback?.(...args);
  };
}
