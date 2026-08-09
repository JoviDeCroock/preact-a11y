const surfaces = [
  [
    'primitives',
    '../dist/index.js',
    [
      'VisuallyHidden',
      'DismissButton',
      'FocusScope',
      'ariaHideOutside',
      'mergeProps',
      'mergeRefs',
      'useButton',
      'useCheckbox',
      'useDisclosure',
      'useField',
      'useFocus',
      'useFocusRing',
      'useFocusVisible',
      'useHover',
      'useLink',
      'useModal',
      'useOverlay',
      'usePress',
      'usePreventScroll',
      'useRadio',
      'useRadioGroup',
      'useSwitch',
      'useTab',
      'useTabList',
      'useTabPanel',
      'useTextField',
      'useToggleButton',
      'useVisuallyHidden',
    ],
  ],
  [
    'components',
    '../dist/components.js',
    [
      'Button',
      'Checkbox',
      'Disclosure',
      'Link',
      'Modal',
      'Radio',
      'RadioGroup',
      'Switch',
      'Tab',
      'TabList',
      'TabPanel',
      'Tabs',
      'TextField',
      'ToggleButton',
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
