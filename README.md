<img src="icon.png" width="52" alt="" />

# react-use-notifications

[![CI](https://github.com/dwapperom/react-use-notifications/actions/workflows/ci.yml/badge.svg)](https://github.com/dwapperom/react-use-notifications/actions/workflows/ci.yml) [![npm](https://img.shields.io/npm/v/react-use-notifications?label=npm)](https://www.npmjs.com/package/react-use-notifications) [![downloads](https://img.shields.io/npm/dm/react-use-notifications)](https://www.npmjs.com/package/react-use-notifications) [![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE) [![React](https://img.shields.io/badge/React-18%20%7C%2019-149eca?logo=react&logoColor=white)](https://react.dev)

Browser notifications are split in two. The constructor is simple but cannot draw buttons or catch
clicks, and the service worker half can do both at the cost of half a day of plumbing. Get it wrong
and nothing crashes: your button never appears and your click goes nowhere.

`react-use-notifications` is one `show()` that picks the right half, tells you what the browser
actually did with it, and brings the click back as a React event.

**[Playground](https://dennis.is-a.dev/react-use-notifications/)** · [Core docs](packages/core#readme) · [UI docs](packages/ui#readme)

```tsx
const { show } = useNotifications();

await show('Ada replied', { body: 'See you at 3' });
```

## Packages

| Package                                     | Version                                                                                                                     | Size                                                                                                                                                 |                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`react-use-notifications`](packages/core)  | [![npm](https://img.shields.io/npm/v/react-use-notifications)](https://www.npmjs.com/package/react-use-notifications)       | [![size](https://img.shields.io/bundlephobia/minzip/react-use-notifications?label=)](https://bundlephobia.com/package/react-use-notifications)       | Hooks, service worker handlers, types |
| [`react-use-notifications-ui`](packages/ui) | [![npm](https://img.shields.io/npm/v/react-use-notifications-ui)](https://www.npmjs.com/package/react-use-notifications-ui) | [![size](https://img.shields.io/bundlephobia/minzip/react-use-notifications-ui?label=)](https://bundlephobia.com/package/react-use-notifications-ui) | Unstyled components, a Tailwind layer on shadcn tokens, and a shadcn registry |

```sh
npm i react-use-notifications
```

The UI package is optional and sits on top.

## Examples

It runs against the built packages, so it exercises the real entry points.

|                                              |                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------- |
| [`examples/playground`](examples/playground) | Every hook and component, a live event log, per-browser diagnostics |

```sh
pnpm install
pnpm --filter playground dev    # http://localhost:5173
```

The playground is what ends up at the link above.

## Contributing

```sh
pnpm install
pnpm verify
```

`verify` covers build, typecheck, lint, unused-code detection, tests and package checks. CI runs
the same command against React 18 and 19.

```sh
pnpm exec playwright install chromium
pnpm e2e
```

The browser suite covers what jsdom cannot: that the engine keeps `actions` on a stored
notification, that it drops a per-action `navigate` (the reason hints ride inside `data`), that the
constructor refuses `actions`, and that the Tailwind layer resolves to real colours. It runs
against Chromium only, because that is the one engine where notification permission can be granted
without a prompt.

Dev dependencies sit on React 18 on purpose, since that is the oldest version supported and it
catches a React 19 only API before anyone else does. To try 19 locally, drop an `overrides` block
into `pnpm-workspace.yaml` for `react`, `react-dom`, `@types/react` and `@types/react-dom`,
reinstall, then take it back out.

## License

MIT
