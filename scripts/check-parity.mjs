import { readFileSync } from 'node:fs';

const surfaces = [
  [
    'primitives',
    '../dist/index.js',
    [
      'VisuallyHidden',
      'DismissButton',
      'FocusScope',
      'HiddenSelect',
      'I18nProvider',
      'SSRProvider',
      'ariaHideOutside',
      'chain',
      'getTextDirection',
      'isRTL',
      'mergeProps',
      'mergeRefs',
      'useButton',
      'useBreadcrumbItem',
      'useBreadcrumbs',
      'useCheckbox',
      'useCollator',
      'useContextMenu',
      'useDateFormatter',
      'useDisclosure',
      'useDialog',
      'useField',
      'useFocus',
      'useFocusRing',
      'useFocusVisible',
      'useFocusWithin',
      'useFilter',
      'useHover',
      'useHiddenSelect',
      'useInteractOutside',
      'useIsSSR',
      'useKeyboard',
      'useLink',
      'useListBox',
      'useListFormatter',
      'useLongPress',
      'useLocale',
      'useLabel',
      'useMenu',
      'useMenuItem',
      'useMenuTrigger',
      'useMeter',
      'useModal',
      'useMove',
      'useNumberFormatter',
      'useNumberField',
      'useObjectRef',
      'useOverlay',
      'useOption',
      'usePress',
      'usePreventScroll',
      'useProgressBar',
      'useRadio',
      'useRadioGroup',
      'useSearchField',
      'useSelect',
      'useSeparator',
      'useSwitch',
      'useTab',
      'useTabList',
      'useTabPanel',
      'useTextField',
      'useToggleButton',
      'useToolbar',
      'useId',
      'useVisuallyHidden',
    ],
  ],
  [
    'components',
    '../dist/components.js',
    [
      'Button',
      'Breadcrumb',
      'Breadcrumbs',
      'Checkbox',
      'Disclosure',
      'Dialog',
      'Link',
      'ListBox',
      'Menu',
      'MenuItem',
      'MenuTrigger',
      'Meter',
      'Modal',
      'NumberField',
      'Option',
      'ProgressBar',
      'Radio',
      'RadioGroup',
      'SearchField',
      'Select',
      'SelectItem',
      'Separator',
      'Switch',
      'Tab',
      'TabList',
      'TabPanel',
      'Tabs',
      'TextField',
      'ToggleButton',
      'Toolbar',
      'VisuallyHidden',
    ],
  ],
];

const failures = await Promise.all(
  surfaces.map(async ([label, moduleId, expected]) => {
    const module = await import(moduleId);
    const missing = expected.filter((name) => !(name in module));
    if (missing.length) console.error(`${label}: missing ${missing.join(', ')}`);
    else console.log(`${label}: ${expected.length} native exports verified`);
    return missing.length > 0;
  }),
);

if (failures.some(Boolean)) process.exitCode = 1;

const baseline = JSON.parse(
  readFileSync(new URL('../docs/react-aria-3.51.0-runtime-exports.json', import.meta.url), 'utf8'),
);
const primitives = await import('../dist/index.js');
const directMatches = baseline.exports.filter((name) => name in primitives);
const remaining = baseline.exports.filter((name) => !(name in primitives));
const nativeExtensions = Object.keys(primitives).filter((name) => !baseline.exports.includes(name));

console.log(
  `upstream: ${directMatches.length}/${baseline.exports.length} direct runtime names matched against react-aria@${baseline.version}`,
);
console.log(
  `upstream: ${remaining.length} direct names remain; behavior-level mappings are tracked by family`,
);
console.log(
  `native: ${nativeExtensions.length} Preact-specific exports (${nativeExtensions.join(', ')})`,
);
