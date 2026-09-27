import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import { afterEach } from 'vitest';

// Preact 11 defers passive effect cleanups on unmount until after paint; flush them before the
// test environment is torn down so they never run against a missing `document`.
afterEach(() => act(() => cleanup()));
