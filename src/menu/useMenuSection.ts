/*
 * Copyright 2020 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See LICENSE.
 * Modified by JoviDeCroock for Preact A11y in 2026.
 */

import type { ComponentChildren } from 'preact';
import type { JSX } from '../preactTypes';
import { useId } from '../utils/useId';

export interface AriaMenuSectionProps {
  heading?: ComponentChildren;
  'aria-label'?: string;
}

export interface MenuSectionAria {
  itemProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'role'>;
  headingProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'id' | 'role'>;
  groupProps: Pick<JSX.HTMLAttributes<HTMLElement>, 'aria-label' | 'aria-labelledby' | 'role'>;
}

/** Provides menu section wrapper, visual heading, and labeled group semantics. */
export function useMenuSection(props: AriaMenuSectionProps): MenuSectionAria {
  const headingId = useId();
  const hasHeading = props.heading != null;
  return {
    itemProps: { role: 'presentation' as const },
    headingProps: hasHeading ? { id: headingId, role: 'presentation' as const } : {},
    groupProps: {
      role: 'group' as const,
      'aria-label': props['aria-label'],
      'aria-labelledby': hasHeading ? headingId : undefined,
    },
  };
}
