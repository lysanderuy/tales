# Design system

What is live in the code. Source of truth: `src/styles/tokens.css`. `src/app/globals.css` maps tokens to Tailwind utilities.

## Principles

| Principle                        | In code                                                           |
| -------------------------------- | ----------------------------------------------------------------- |
| Flat                             | No shadows. `--shadow-none: none`.                                |
| Hairline borders                 | `--border` at `--border-width: 1px` is the only separator.        |
| Pastel sage ground               | `--bg` is a pale green. Cards sit on it as `--surface`.           |
| One deep-green hero card         | `--hero` with `--on-hero*` text.                                  |
| Large soft numerals              | Clock and big figures are weight 400 in `--time`, tight tracking. |
| Circular icon buttons            | `IconButton` is always `rounded-full`. Icon stroke is `1.8`.      |
| Overtime is apricot              | `--overtime`: time past the plan. A fact, not a warning.          |
| Muted red is for system messages | `--danger`: errors and confirm-delete. Never on study data.       |

## Color

Defined on `:root` (light). `[data-theme="dark"]` overrides the rows marked with a dark value. Tailwind names are `bg-*`, `text-*`, `border-*` plus the token name (e.g. `bg-surface`, `text-text-soft`).

| Token            | Role                                     | Light                      | Dark                       |
| ---------------- | ---------------------------------------- | -------------------------- | -------------------------- |
| `--bg`           | Page                                     | `#EAF1E6`                  | `#0F1A14`                  |
| `--surface`      | Cards, menus, picker                     | `#FBFCF8`                  | `#17241D`                  |
| `--fill`         | Inputs, chips, quiet buttons             | `rgba(31, 77, 58, .07)`    | `rgba(200, 235, 215, .09)` |
| `--fill-hover`   | Fill hover                               | `rgba(31, 77, 58, .13)`    | `rgba(200, 235, 215, .16)` |
| `--border`       | Hairline separator                       | `rgba(31, 77, 58, .12)`    | `rgba(200, 235, 215, .14)` |
| `--material`     | Top bar (20px backdrop blur)             | `rgba(251, 252, 248, .82)` | `rgba(23, 36, 29, .85)`    |
| `--scrim`        | Behind dialogs                           | `rgba(15, 26, 20, .35)`    | same                       |
| `--text`         | Body text                                | `#1F2A24`                  | `#EAF2EC`                  |
| `--text-soft`    | Secondary text                           | `#5E6B63`                  | `#A8B7AD`                  |
| `--text-faint`   | Eyebrows, paths, placeholders            | `#86928A`                  | `#7D8C82`                  |
| `--time`         | Clock and big figures                    | `#1F4D3A`                  | `#D6EEDF`                  |
| `--primary`      | Brand, primary button, focus ring        | `#2E6B4F`                  | `#7CD3A5`                  |
| `--on-primary`   | Text on primary                          | `#FFFFFF`                  | `#0F2A1D`                  |
| `--primary-soft` | Active tab, selected chip, tinted button | `rgba(46, 107, 79, .14)`   | `rgba(124, 211, 165, .16)` |
| `--hero`         | The one deep-green card                  | `#2E6B4F`                  | `#1F4A36`                  |
| `--on-hero`      | Text on hero                             | `#FFFFFF`                  | `#EAF7EF`                  |
| `--on-hero-soft` | Secondary text on hero                   | `rgba(255, 255, 255, .72)` | `rgba(234, 247, 239, .7)`  |
| `--on-hero-line` | Lines on hero                            | `rgba(255, 255, 255, .22)` | `rgba(234, 247, 239, .2)`  |
| `--overtime`     | Time past the plan                       | `#CF7A33`                  | `#F0A263`                  |
| `--danger`       | System messages only                     | `#B5483C`                  | `#E58B7F`                  |

## Subject palette

`--c-1` to `--c-8`. Pastel, identical in light and dark. Assigned per Subject in order; Topics inherit. Tailwind: `bg-c-1` etc.

| Token   | Hex       | Name                         | Status   |
| ------- | --------- | ---------------------------- | -------- |
| `--c-1` | `#C8B8E6` | lilac (ISBB)                 | Settled  |
| `--c-2` | `#F4D88C` | butter (Clinical Microscopy) | Settled  |
| `--c-3` | `#A9CBE8` | sky                          | Proposed |
| `--c-4` | `#EDB4C2` | rose                         | Proposed |
| `--c-5` | `#A8DBC0` | mint                         | Proposed |
| `--c-6` | `#DCC7A8` | sand                         | Proposed |
| `--c-7` | `#C5D8A4` | lime sage                    | Proposed |
| `--c-8` | `#B9C3E8` | periwinkle                   | Proposed |

## Typography

Font: DM Sans via `next/font/google`, `latin` subset, optical-size (`opsz`) axis, `display: swap`. Exposed as `--font-dm-sans`; `--font` falls back to `system-ui, -apple-system, "Segoe UI", sans-serif`. Body is `16px` / line-height `1.45`, antialiased.

Weights

| Token           | Value | Use                     |
| --------------- | ----- | ----------------------- |
| `--fw-regular`  | 400   | Clock, big figures      |
| `--fw-medium`   | 500   | Eyebrows, tabs, buttons |
| `--fw-semibold` | 600   | Names, headings         |

Sizes (Tailwind: `text-<name>`, except those marked none)

| Token          | Size                       | Use                                     |
| -------------- | -------------------------- | --------------------------------------- |
| `--fs-eyebrow` | 12px                       | Uppercase label                         |
| `--fs-caption` | 13px                       | Paths, secondary lines                  |
| `--fs-small`   | 14px                       |                                         |
| `--fs-ui`      | 15px                       | Buttons, rows, tabs                     |
| `--fs-body`    | 16px                       | Body                                    |
| `--fs-name`    | 17px                       | Subject name in Focus, running bar time |
| `--fs-h2`      | 18px                       |                                         |
| `--fs-logo`    | 20px                       |                                         |
| `--fs-h1`      | 28px                       |                                         |
| `--fs-total`   | 40px                       | Today's total                           |
| `--fs-end`     | `clamp(64px, 8vw, 84px)`   | End screen duration (no Tailwind alias) |
| `--fs-hero`    | 88px                       | Days to boards                          |
| `--fs-timer`   | `clamp(96px, 19vw, 200px)` | Focus mode clock                        |

Line height and tracking

| Token          | Value   |
| -------------- | ------- |
| `--lh-body`    | 1.45    |
| `--lh-display` | 1       |
| `--ls-eyebrow` | .1em    |
| `--ls-h2`      | -0.01em |
| `--ls-h1`      | -0.02em |
| `--ls-display` | -0.03em |

Helpers (`globals.css`)

| Class      | Effect                                                            |
| ---------- | ----------------------------------------------------------------- |
| `.eyebrow` | 12px, weight 500, .1em tracking, uppercase, `--text-faint`        |
| `.num`     | `font-variant-numeric: tabular-nums`. Use on any changing number. |

## Spacing

4px base.

| Token     | px  |
| --------- | --- |
| `--sp-1`  | 4   |
| `--sp-2`  | 8   |
| `--sp-3`  | 12  |
| `--sp-4`  | 16  |
| `--sp-5`  | 20  |
| `--sp-6`  | 24  |
| `--sp-8`  | 32  |
| `--sp-10` | 40  |
| `--sp-14` | 56  |
| `--sp-18` | 72  |

## Radii

| Token             | px  | Use                          | Tailwind        |
| ----------------- | --- | ---------------------------- | --------------- |
| `--radius-sm`     | 10  | Menu and picker rows         | `rounded-row`   |
| `--radius-md`     | 14  | Inputs, fields, menus        | `rounded-field` |
| `--radius-picker` | 18  | Picker                       | none            |
| `--radius-lg`     | 24  | Cards, dialogs               | `rounded-card`  |
| `--radius-pill`   | 999 | Buttons, chips, tabs, search | `rounded-full`  |

## Control sizes

| Token      | px  |
| ---------- | --- |
| `--ctl-xs` | 34  |
| `--ctl-sm` | 40  |
| `--ctl-md` | 44  |
| `--ctl-xl` | 56  |
| `--ctl-lg` | 80  |

## Layout

| Token             | Value  |
| ----------------- | ------ |
| `--page-max`      | 1200px |
| `--page-pad`      | 24px   |
| `--grid-gap`      | 16px   |
| `--card-pad`      | 24px   |
| `--topbar-h`      | 64px   |
| `--picker-w`      | 320px  |
| `--picker-side-w` | 280px  |
| `--menu-w`        | 280px  |
| `--dialog-w`      | 460px  |
| `--endscreen-w`   | 460px  |

Breakpoints (documented in `tokens.css`; custom properties cannot be used in `@media`, so write the pixel value)

| Name  | Width  | Effect                               |
| ----- | ------ | ------------------------------------ |
| tabs  | 1000px | Tabs leave the centre and sit inline |
| stack | 900px  | Grid columns stack to one column     |

## Motion

| Token        | Value | Use                |
| ------------ | ----- | ------------------ |
| `--dur-fast` | .15s  | Hover, press       |
| `--dur-base` | .2s   |                    |
| `--dur-slow` | .3s   | Clock color change |

`.press` transitions transform, background-color, color, opacity at `--dur-fast`, and scales to `0.94` on `:active` (not when disabled).

## Layers

| Token        | z-index |
| ------------ | ------- |
| `--z-top`    | 5       |
| `--z-focus`  | 20      |
| `--z-dialog` | 30      |
| `--z-float`  | 40      |

## Focus

Global `:focus-visible`: `2px solid var(--primary)`, offset `3px`. Text inputs in `components/shared` that set `outline-none` use an inset `box-shadow` ring instead (see Known exceptions).

## Theming

- Theme is `light` or `dark`, set as `data-theme` on `<html>`.
- `RootLayout` reads the `tales-theme` cookie on the server and sets `data-theme` only if the value is `light` or `dark`. `generateViewport` sets the browser theme color from the same cookie.
- No OS preference (`prefers-color-scheme`) is read. With no cookie, `data-theme` is unset and the `:root` light tokens apply, so the first visit is light.
- `ThemeSync` (client) takes `theme` from the profile query, sets `documentElement.dataset.theme`, and writes the cookie (`path=/`, 1 year, `SameSite=Lax`) so the next server render matches.

## Components (`src/components/ui`)

| Component    | Props                                                                                                                                                               | Notes                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`     | `variant`: `primary` (default) or `fill`; all button attributes                                                                                                     | Pill, `px-[30px] py-3`, 16px, weight 500, disabled 50% opacity, `press`. `type` defaults to `button`. `buttonClass(variant, className)` gives the same classes for links. |
| `IconButton` | `label` (required; sets `title` and `aria-label`), `size`: `xs` 34 / `sm` 40 / `md` 44 (default) / `lg` 80; `variant`: `fill` (default) / `tint` / `solid` / `warm` | Circular, `shrink-0`, forwards ref. `warm` is overtime at 18% mix with overtime text.                                                                                     |
| `Card`       | `as` (default `section`)                                                                                                                                            | `rounded-card`, 1px border, `bg-surface`, `p-6`.                                                                                                                          |
| `Eyebrow`    | `as` (default `span`)                                                                                                                                               | Applies `.eyebrow`.                                                                                                                                                       |
| `Swatch`     | `color` (CSS color string)                                                                                                                                          | 10px square, 3px radius, `aria-hidden`.                                                                                                                                   |
| `TextField`  | `label`, `error`, `trailing`; input attributes                                                                                                                      | Eyebrow label, `min-h-[52px]` row, `rounded-field`, `bg-fill` with hover. Error shown in `text-danger` and wired with `aria-invalid` / `aria-describedby`.                |

## Known exceptions

- `box-shadow` is used, not for elevation:
  - Focus rings: inset `1.5px` ring on inputs in `subjects-weight-field`, `subjects-add-row`, `subjects-rename-input` (`--primary`) and `subjects-search` (`--border`).
  - Avatar crop: `settings-crop-stage` (mask and ring) and `settings-crop-handle`.

## Known drift

Hardcoded colors outside `tokens.css`, to fix later.

| File                                                                                                           | Value                                                                                   | Should be                                                     |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `src/app/manifest.ts`                                                                                          | `#EAF1E6` (background, theme)                                                           | `--bg` light                                                  |
| `src/app/layout.tsx`                                                                                           | `#0F1A14` / `#EAF1E6` (viewport theme color)                                            | `--bg` dark / light                                           |
| `src/hooks/use-timer-favicon.ts`                                                                               | run `#2E6B4F` / `#7CD3A5`, overtime `#CF7A33` / `#F0A263`, paused `#86928A` / `#7D8C82` | `--primary`, `--overtime`, `--text-faint` (these match today) |
| `src/app/icon.svg`                                                                                             | `#2F5D46` background, `#F1EFE4` book                                                    | `#2F5D46` differs from `--primary` `#2E6B4F`                  |
| `src/app/global-error.tsx`                                                                                     | `#888`, `#ccc`                                                                          | Tokens (renders outside the theme)                            |
| `src/components/shared/settings-crop-stage.tsx`, `settings-crop-handle.tsx`, `src/lib/settings/crop-export.ts` | `#fff`, `rgba(0,0,0,...)`                                                               | Crop UI over a photo; fixed white/black by intent             |
