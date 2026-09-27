/** Preact 11 no longer appends `px` to numeric style values, so lengths are written out. */
export function px(value: number | undefined) {
  return value == null ? undefined : `${value}px`;
}
