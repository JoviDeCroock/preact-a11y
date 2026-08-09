const surfaces = [
  [
    'primitives',
    '../dist/index.js',
    [
      'VisuallyHidden',
      'mergeProps',
      'mergeRefs',
      'useButton',
      'useCheckbox',
      'useField',
      'useFocus',
      'useFocusRing',
      'useFocusVisible',
      'useHover',
      'usePress',
      'useRadio',
      'useRadioGroup',
      'useSwitch',
      'useTextField',
      'useVisuallyHidden',
    ],
  ],
  [
    'components',
    '../dist/components.js',
    ['Button', 'Checkbox', 'Radio', 'RadioGroup', 'Switch', 'TextField', 'VisuallyHidden'],
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
