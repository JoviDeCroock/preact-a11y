# Internationalization and routing

Accessible behavior must respect locale, writing direction, formatting conventions, and the
application's navigation model.

## Locale and direction

Wrap an application or subtree with `I18nProvider` to set the locale. Direction is derived from
the locale and exposed through `useLocale`.

```tsx
import { I18nProvider, useLocale } from 'preact-a11y';

function DirectionalLayout() {
  const { locale, direction } = useLocale();
  return (
    <main dir={direction} lang={locale}>
      {/* application */}
    </main>
  );
}

export function App() {
  return (
    <I18nProvider locale="ar-EG">
      <DirectionalLayout />
    </I18nProvider>
  );
}
```

Collection navigation, overlay placement, menus, sliders, and other directional primitives use
the current writing direction. Do not hard-code left and right when start and end express the
intent.

## Intl helpers

The formatter hooks memoize native `Intl` objects for the active locale:

- `useNumberFormatter`
- `useDateFormatter`
- `useListFormatter`
- `useCollator`
- `useFilter`

`NumberField`, date fields, calendar primitives, and color fields build on locale-aware parsing or
formatting rather than assuming English punctuation and ordering.

## Localized messages

`LocalizedStringDictionary` stores locale-keyed message sets, and `LocalizedStringFormatter`
formats messages and variables with locale fallback. The matching hooks connect those objects to
the current provider.

Keep interaction announcements concise. Translate action, position, count, and error messages as
complete phrases so translators can change word order.

## Client-side routing

`RouterProvider` lets the `Link` component use a client-side router while retaining native anchor
behavior for modified clicks, downloads, external origins, and non-default targets.

```tsx
import { RouterProvider } from 'preact-a11y';
import { Link } from 'preact-a11y/components';

export function App() {
  return (
    <RouterProvider
      navigate={(path, options) => router.navigate(path, options)}
      useHref={(href) => router.resolve(href)}
    >
      <Link href="/settings">Settings</Link>
    </RouterProvider>
  );
}
```

Without a `RouterProvider`, links use the browser's native navigation. Always provide a real
`href`; click-only elements do not expose link destinations to assistive technology or browser
features.
