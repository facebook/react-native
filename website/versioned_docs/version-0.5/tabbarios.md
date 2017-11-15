---
id: version-0.5-tabbarios
title: TabBarIOS
original_id: tabbarios
---
### Props

- [View props...](docs/view-props.html)
- [`barStyle`](docs/tabbarios.html#barstyle)
- [`barTintColor`](docs/tabbarios.html#bartintcolor)
- [`itemPositioning`](docs/tabbarios.html#itempositioning)
- [`style`](docs/tabbarios.html#style)
- [`tintColor`](docs/tabbarios.html#tintcolor)
- [`translucent`](docs/tabbarios.html#translucent)
- [`unselectedItemTintColor`](docs/tabbarios.html#unselecteditemtintcolor)
- [`unselectedTintColor`](docs/tabbarios.html#unselectedtintcolor)






---

# Reference

## Props

### `barStyle`

The style of the tab bar. Supported values are 'default', 'black'.
Use 'black' instead of setting `barTintColor` to black. This produces
a tab bar with the native iOS style with higher translucency.

| Type | Required |
| - | - |
| enum('default', 'black') | No |




---

### `barTintColor`

Background color of the tab bar

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `itemPositioning`

Specifies tab bar item positioning. Available values are:

- `fill` - distributes items across the entire width of the tab bar
- `center` - centers item in the available tab bar space
- `auto` (default) - distributes items dynamically according to the user interface idiom. In a horizontally compact environment (e.g. iPhone 5) this value defaults to `fill`, in a horizontally regular one (e.g. iPad) it defaults to center.

| Type | Required |
| - | - |
| enum('fill', 'center', 'auto') | No |




---

### `style`



| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |




---

### `tintColor`

Color of the currently selected tab icon

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `translucent`

A Boolean value that indicates whether the tab bar is translucent

| Type | Required |
| - | - |
| bool | No |




---

### `unselectedItemTintColor`

Color of unselected tab icons. Available since iOS 10.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `unselectedTintColor`

Color of text on unselected tabs

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |






