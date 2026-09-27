import type { JSX, RefObject } from '../preactTypes';
import { useEffect } from 'preact/hooks';

export type AriaLandmarkRole =
  | 'main'
  | 'region'
  | 'search'
  | 'navigation'
  | 'form'
  | 'banner'
  | 'contentinfo'
  | 'complementary';

export interface AriaLandmarkProps {
  role: AriaLandmarkRole;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Override focus placement, for example to focus a heading inside the landmark. */
  focus?: (direction: 'forward' | 'backward') => void;
}

export interface LandmarkAria {
  landmarkProps: Pick<
    JSX.HTMLAttributes<HTMLElement>,
    'aria-label' | 'aria-labelledby' | 'role' | 'tabIndex'
  >;
}

interface LandmarkRegistration {
  element: HTMLElement;
  role: AriaLandmarkRole;
  focus?: (direction: 'forward' | 'backward') => void;
}

export interface LandmarkControllerOptions {
  from?: HTMLElement;
}

export interface LandmarkController {
  focusNext(options?: LandmarkControllerOptions): boolean;
  focusPrevious(options?: LandmarkControllerOptions): boolean;
  focusMain(): boolean;
  navigate(direction: 'forward' | 'backward', options?: LandmarkControllerOptions): boolean;
  dispose(): void;
}

const registrations = new Map<HTMLElement, LandmarkRegistration>();
const documentUsage = new Map<
  Document,
  { controllers: number; landmarks: number; listener: (event: KeyboardEvent) => void }
>();

function orderedLandmarks(doc: Document) {
  const ordered: LandmarkRegistration[] = [];
  for (const registration of registrations.values()) {
    const { element } = registration;
    if (!element.isConnected || element.ownerDocument !== doc) continue;
    const index = ordered.findIndex(
      (current) =>
        element.compareDocumentPosition(current.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    if (index < 0) ordered.push(registration);
    else ordered.splice(index, 0, registration);
  }
  return ordered;
}

function focusRegistration(
  registration: LandmarkRegistration | undefined,
  direction: 'forward' | 'backward',
) {
  if (!registration) return false;
  if (registration.focus) registration.focus(direction);
  else registration.element.focus();
  return true;
}

function navigateLandmarks(
  doc: Document,
  direction: 'forward' | 'backward',
  from = doc.activeElement instanceof HTMLElement ? doc.activeElement : undefined,
) {
  const landmarks = orderedLandmarks(doc);
  if (!landmarks.length) return false;

  const currentIndex = from
    ? landmarks.findIndex(({ element }) => element === from || element.contains(from))
    : -1;
  if (currentIndex >= 0) {
    const offset = direction === 'forward' ? 1 : -1;
    const index = (currentIndex + offset + landmarks.length) % landmarks.length;
    return focusRegistration(landmarks[index], direction);
  }

  if (from) {
    const candidates = landmarks.filter(({ element }) => {
      const relation = from.compareDocumentPosition(element);
      return direction === 'forward'
        ? Boolean(relation & Node.DOCUMENT_POSITION_FOLLOWING)
        : Boolean(relation & Node.DOCUMENT_POSITION_PRECEDING);
    });
    return focusRegistration(
      (direction === 'forward' ? candidates[0] : candidates.at(-1)) ??
        (direction === 'forward' ? landmarks[0] : landmarks.at(-1)),
      direction,
    );
  }

  return focusRegistration(direction === 'forward' ? landmarks[0] : landmarks.at(-1), direction);
}

function retainDocument(doc: Document, kind: 'controllers' | 'landmarks') {
  let usage = documentUsage.get(doc);
  if (!usage) {
    const listener = (event: KeyboardEvent) => {
      if (event.key !== 'F6' || event.altKey || event.ctrlKey || event.metaKey) return;
      if (navigateLandmarks(doc, event.shiftKey ? 'backward' : 'forward')) event.preventDefault();
    };
    usage = { controllers: 0, landmarks: 0, listener };
    documentUsage.set(doc, usage);
    doc.addEventListener('keydown', listener, true);
  }
  usage[kind] += 1;
}

function releaseDocument(doc: Document, kind: 'controllers' | 'landmarks') {
  const usage = documentUsage.get(doc);
  if (!usage) return;
  usage[kind] -= 1;
  if (usage.controllers > 0 || usage.landmarks > 0) return;
  doc.removeEventListener('keydown', usage.listener, true);
  documentUsage.delete(doc);
}

/** Creates an imperative controller for F6-style landmark navigation. */
export function UNSTABLE_createLandmarkController(): LandmarkController {
  const doc = typeof document === 'undefined' ? undefined : document;
  if (doc) retainDocument(doc, 'controllers');
  let disposed = false;

  const navigate = (direction: 'forward' | 'backward', options: LandmarkControllerOptions = {}) =>
    !disposed && !!doc && navigateLandmarks(doc, direction, options.from);

  return {
    focusNext: (options) => navigate('forward', options),
    focusPrevious: (options) => navigate('backward', options),
    focusMain() {
      if (disposed || !doc) return false;
      return focusRegistration(
        orderedLandmarks(doc).find(({ role }) => role === 'main'),
        'forward',
      );
    },
    navigate,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (doc) releaseDocument(doc, 'controllers');
    },
  };
}

/** Registers a labeled landmark for keyboard and imperative navigation. */
export function useLandmark(props: AriaLandmarkProps, ref: RefObject<HTMLElement>): LandmarkAria {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    registrations.set(element, { element, role: props.role, focus: props.focus });
    retainDocument(element.ownerDocument, 'landmarks');
    return () => {
      registrations.delete(element);
      releaseDocument(element.ownerDocument, 'landmarks');
    };
  }, [props.focus, props.role, ref]);

  return {
    landmarkProps: {
      role: props.role,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      tabIndex: -1,
    },
  };
}
