import type { ComponentChildren, Ref } from 'preact';
import type { JSX } from '../preactTypes';
import { useRef } from 'preact/hooks';
import { useSlider, type AriaSliderProps } from '../slider/useSlider';
import { useSliderThumb } from '../slider/useSliderThumb';

export interface SliderProps extends AriaSliderProps {
  name?: string;
  thumbLabels?: string[];
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  outputClassName?: string;
  elementRef?: Ref<HTMLDivElement>;
  renderThumb?: (index: number) => ComponentChildren;
}

interface SliderThumbProps {
  index: number;
  label: string;
  name?: string;
  className?: string;
  inputClassName?: string;
  state: ReturnType<typeof useSlider>['state'];
  formatOptions?: Intl.NumberFormatOptions;
  renderThumb?: (index: number) => ComponentChildren;
}

function SliderThumb({
  index,
  label,
  name,
  className,
  inputClassName,
  state,
  formatOptions,
  renderThumb,
}: SliderThumbProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { thumbProps, inputProps } = useSliderThumb(
    { index, label, name, formatOptions },
    state,
    inputRef,
  );
  const position = `${state.getThumbPercent(index)}%`;
  const style: JSX.CSSProperties = {
    ...(thumbProps.style as JSX.CSSProperties | undefined),
    ...(state.orientation === 'vertical' ? { bottom: position } : { left: position }),
  };
  return (
    <span {...thumbProps} className={className} data-slider-thumb style={style}>
      <input {...inputProps} className={inputClassName} />
      {renderThumb?.(index)}
    </span>
  );
}

export function Slider({
  name,
  thumbLabels,
  className,
  trackClassName,
  thumbClassName,
  inputClassName,
  labelClassName,
  outputClassName,
  elementRef,
  renderThumb,
  label,
  description,
  errorMessage,
  isInvalid,
  ...props
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const result = useSlider({ label, description, errorMessage, isInvalid, ...props }, trackRef);
  const isRange = result.state.values.length > 1;

  function thumbLabel(index: number) {
    if (thumbLabels?.[index]) return thumbLabels[index];
    const base = typeof label === 'string' ? label : (props['aria-label'] ?? 'Value');
    if (!isRange) return base;
    if (index === 0) return `Minimum ${base}`;
    if (index === result.state.values.length - 1) return `Maximum ${base}`;
    return `${base} ${index + 1}`;
  }

  return (
    <div
      {...result.groupProps}
      className={className}
      data-invalid={isInvalid || undefined}
      data-orientation={result.state.orientation}
      ref={elementRef}
    >
      {label != null && (
        <span id={result.labelProps.id} className={labelClassName}>
          {label}
        </span>
      )}
      <output {...result.outputProps} className={outputClassName}>
        {result.valueText}
      </output>
      <div {...result.trackProps} className={trackClassName} data-slider-track>
        {result.state.values.map((_, index) => (
          <SliderThumb
            className={thumbClassName}
            formatOptions={props.formatOptions}
            index={index}
            inputClassName={inputClassName}
            key={index}
            label={thumbLabel(index)}
            name={name}
            renderThumb={renderThumb}
            state={result.state}
          />
        ))}
      </div>
      {description != null && <div {...result.descriptionProps}>{description}</div>}
      {isInvalid && errorMessage != null && <div {...result.errorMessageProps}>{errorMessage}</div>}
    </div>
  );
}
