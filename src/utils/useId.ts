import { useId as usePreactId } from 'preact/hooks';

export function useId(defaultId?: string): string {
  const generatedId = usePreactId();
  return defaultId ?? `preact-aria-${generatedId}`;
}
