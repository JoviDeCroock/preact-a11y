/*
 * Copyright 2020 Adobe. All rights reserved.
 * Licensed under the Apache License, Version 2.0. See LICENSE.
 * Modified by JoviDeCroock for Preact A11y in 2026.
 */

import type { RefObject } from 'preact';
import type { JSX } from '../preactTypes';
import { useCallback, useLayoutEffect, useState } from 'preact/hooks';
import { useLocale } from '../i18n/I18nProvider';

export type Placement =
  | 'bottom'
  | 'bottom left'
  | 'bottom right'
  | 'bottom start'
  | 'bottom end'
  | 'top'
  | 'top left'
  | 'top right'
  | 'top start'
  | 'top end'
  | 'left'
  | 'left top'
  | 'left bottom'
  | 'start'
  | 'start top'
  | 'start bottom'
  | 'right'
  | 'right top'
  | 'right bottom'
  | 'end'
  | 'end top'
  | 'end bottom';

export type PlacementAxis = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface AriaPositionProps {
  targetRef: RefObject<Element>;
  overlayRef: RefObject<HTMLElement>;
  arrowRef?: RefObject<HTMLElement>;
  placement?: Placement;
  containerPadding?: number;
  offset?: number;
  crossOffset?: number;
  shouldFlip?: boolean;
  isOpen?: boolean;
  shouldUpdatePosition?: boolean;
  boundaryElement?: Element;
  maxHeight?: number;
  arrowSize?: number;
  arrowBoundaryOffset?: number;
  getTargetRect?: (target: Element) => DOMRect | null | undefined;
  onClose?: (() => void) | null;
}

interface PositionResult {
  left: number;
  top: number;
  maxHeight?: number;
  placement: Exclude<PlacementAxis, 'center'>;
  anchor: { x: number; y: number };
  arrowLeft?: number;
  arrowTop?: number;
}

function opposite(side: Exclude<PlacementAxis, 'center'>) {
  if (side === 'top') return 'bottom';
  if (side === 'bottom') return 'top';
  if (side === 'left') return 'right';
  return 'left';
}

function availableSpace(
  side: Exclude<PlacementAxis, 'center'>,
  target: DOMRect,
  boundary: DOMRect,
) {
  if (side === 'top') return target.top - boundary.top;
  if (side === 'bottom') return boundary.bottom - target.bottom;
  if (side === 'left') return target.left - boundary.left;
  return boundary.right - target.right;
}

export function useOverlayPosition(props: AriaPositionProps) {
  const { direction } = useLocale();
  const [position, setPosition] = useState<PositionResult | null>(null);
  const preferredPlacement = props.placement ?? 'bottom';

  const updatePosition = useCallback(() => {
    const target = props.targetRef.current;
    const overlay = props.overlayRef.current;
    if (!props.isOpen || !target || !overlay) return;
    if (!target.isConnected) {
      props.onClose?.();
      return;
    }

    const targetRect = props.getTargetRect?.(target) ?? target.getBoundingClientRect();
    if (!targetRect) return;
    const overlayRect = overlay.getBoundingClientRect();
    const viewport = new DOMRect(
      0,
      0,
      document.documentElement.clientWidth || window.innerWidth,
      document.documentElement.clientHeight || window.innerHeight,
    );
    const boundary = props.boundaryElement?.getBoundingClientRect() ?? viewport;
    const padding = props.containerPadding ?? 12;
    const offset = props.offset ?? 0;
    const crossOffset = props.crossOffset ?? 0;
    const [rawSide, rawAlign] = preferredPlacement.split(' ');
    const logicalSide = rawSide === 'start' ? (direction === 'rtl' ? 'right' : 'left') : rawSide;
    const logicalEnd =
      logicalSide === 'end' ? (direction === 'rtl' ? 'left' : 'right') : logicalSide;
    let side = logicalEnd as Exclude<PlacementAxis, 'center'>;
    const mainSize = side === 'top' || side === 'bottom' ? overlayRect.height : overlayRect.width;
    const alternate = opposite(side);
    if (
      props.shouldFlip !== false &&
      availableSpace(side, targetRect, boundary) < mainSize + offset + padding &&
      availableSpace(alternate, targetRect, boundary) > availableSpace(side, targetRect, boundary)
    ) {
      side = alternate;
    }

    let left = 0;
    let top = 0;
    const horizontalAlign =
      rawAlign === 'start'
        ? direction === 'rtl'
          ? 'right'
          : 'left'
        : rawAlign === 'end'
          ? direction === 'rtl'
            ? 'left'
            : 'right'
          : rawAlign;
    if (side === 'top' || side === 'bottom') {
      top =
        side === 'bottom'
          ? targetRect.bottom + offset
          : targetRect.top - overlayRect.height - offset;
      if (horizontalAlign === 'left') left = targetRect.left + crossOffset;
      else if (horizontalAlign === 'right')
        left = targetRect.right - overlayRect.width + crossOffset;
      else left = targetRect.left + (targetRect.width - overlayRect.width) / 2 + crossOffset;
    } else {
      left =
        side === 'right' ? targetRect.right + offset : targetRect.left - overlayRect.width - offset;
      if (rawAlign === 'top') top = targetRect.top + crossOffset;
      else if (rawAlign === 'bottom') top = targetRect.bottom - overlayRect.height + crossOffset;
      else top = targetRect.top + (targetRect.height - overlayRect.height) / 2 + crossOffset;
    }

    left = Math.min(
      boundary.right - padding - overlayRect.width,
      Math.max(boundary.left + padding, left),
    );
    top = Math.min(
      boundary.bottom - padding - overlayRect.height,
      Math.max(boundary.top + padding, top),
    );
    const anchor = {
      x: targetRect.left + targetRect.width / 2 - left,
      y: targetRect.top + targetRect.height / 2 - top,
    };
    const arrowHalf = (props.arrowSize ?? 0) / 2;
    const arrowBoundary = (props.arrowBoundaryOffset ?? 0) + arrowHalf;
    setPosition({
      left,
      top,
      maxHeight: Math.min(
        props.maxHeight ?? Infinity,
        Math.max(0, availableSpace(side, targetRect, boundary) - offset - padding),
      ),
      placement: side,
      anchor,
      arrowLeft:
        side === 'top' || side === 'bottom'
          ? Math.min(overlayRect.width - arrowBoundary, Math.max(arrowBoundary, anchor.x))
          : undefined,
      arrowTop:
        side === 'left' || side === 'right'
          ? Math.min(overlayRect.height - arrowBoundary, Math.max(arrowBoundary, anchor.y))
          : undefined,
    });
  }, [
    direction,
    preferredPlacement,
    props.arrowBoundaryOffset,
    props.arrowSize,
    props.boundaryElement,
    props.containerPadding,
    props.crossOffset,
    props.getTargetRect,
    props.isOpen,
    props.maxHeight,
    props.offset,
    props.onClose,
    props.overlayRef,
    props.shouldFlip,
    props.targetRef,
  ]);

  useLayoutEffect(() => {
    if (!props.isOpen) {
      setPosition(null);
      return;
    }
    updatePosition();
    if (props.shouldUpdatePosition === false) return;
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updatePosition);
    if (props.targetRef.current) observer?.observe(props.targetRef.current);
    if (props.overlayRef.current) observer?.observe(props.overlayRef.current);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [props.isOpen, props.overlayRef, props.shouldUpdatePosition, props.targetRef, updatePosition]);

  return {
    overlayProps: {
      style: {
        position: 'fixed',
        left: position?.left,
        top: position?.top,
        maxHeight: position?.maxHeight,
        visibility: position ? undefined : 'hidden',
      },
      'data-placement': position?.placement,
    } as JSX.HTMLAttributes<HTMLElement> & { 'data-placement'?: string },
    arrowProps: {
      style: {
        position: 'absolute',
        left: position?.arrowLeft,
        top: position?.arrowTop,
      },
    } satisfies JSX.HTMLAttributes<HTMLElement>,
    placement: position?.placement ?? null,
    triggerAnchorPoint: position?.anchor ?? null,
    updatePosition,
  };
}
