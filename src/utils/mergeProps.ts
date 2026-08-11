const EVENT_HANDLER = /^on(?:[A-Z]|focus(?:in|out)$|pointer(?:enter|leave)$)/;

export function mergeProps<T extends Record<string, unknown>>(...sources: T[]): T {
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    for (const key in source) {
      const left = result[key];
      const right = source[key];

      if (EVENT_HANDLER.test(key) && typeof left === 'function' && typeof right === 'function') {
        result[key] = (...args: unknown[]) => {
          left(...args);
          right(...args);
        };
      } else if (key === 'className' && left && right) {
        result[key] = `${left} ${right}`;
      } else if (key === 'style' && typeof left === 'object' && typeof right === 'object') {
        result[key] = { ...left, ...right };
      } else if (right !== undefined) {
        result[key] = right;
      }
    }
  }

  return result as T;
}
