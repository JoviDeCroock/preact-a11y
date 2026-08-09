import {
  useHiddenSelect,
  type AriaHiddenSelectProps,
  type HiddenSelectOption,
} from './useHiddenSelect';
import { useVisuallyHidden } from '../visually-hidden';

export interface HiddenSelectProps extends AriaHiddenSelectProps {
  options: HiddenSelectOption[];
}

export function HiddenSelect({ options, ...props }: HiddenSelectProps) {
  const { selectProps } = useHiddenSelect(props);
  const { visuallyHiddenProps } = useVisuallyHidden();
  return (
    <div {...visuallyHiddenProps} aria-hidden="true">
      <select {...selectProps}>
        <option value="" />
        {options.map((option) => (
          <option disabled={option.isDisabled} key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
