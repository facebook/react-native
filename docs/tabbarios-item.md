---
id: tabbarios-item
title: TabBarIOS.Item
layout: docs
category: components
permalink: docs/tabbarios-item.html
next: text
previous: tabbarios
---

### Props

- [ViewPropTypes props...](docs/viewproptypes.html#props)
- [`selected`](docs/tabbarios-item.html#selected)
- [`badge`](docs/tabbarios-item.html#badge)
- [`icon`](docs/tabbarios-item.html#icon)
- [`onPress`](docs/tabbarios-item.html#onpress)
- [`renderAsOriginal`](docs/tabbarios-item.html#renderasoriginal)
- [`badgeColor`](docs/tabbarios-item.html#badgecolor)
- [`selectedIcon`](docs/tabbarios-item.html#selectedicon)
- [`style`](docs/tabbarios-item.html#style)
- [`systemIcon`](docs/tabbarios-item.html#systemicon)
- [`title`](docs/tabbarios-item.html#title)
- [`isTVSelectable`](docs/tabbarios-item.html#istvselectable)






---

# Reference

## Props

### `selected`

It specifies whether the children are visible or not. If you see a
blank content, you probably forgot to add a selected one.

| Type | Required |
| - | - |
| bool | No |




---

### `badge`

Little red bubble that sits at the top right of the icon.

| Type | Required |
| - | - |
| string, number | No |




---

### `icon`

A custom icon for the tab. It is ignored when a system icon is defined.

| Type | Required |
| - | - |
| Image.propTypes.source | No |




---

### `onPress`

Callback when this tab is being selected, you should change the state of your
component to set selected={true}.

| Type | Required |
| - | - |
| function | No |




---

### `renderAsOriginal`

If set to true it renders the image as original,
it defaults to being displayed as a template

| Type | Required |
| - | - |
| bool | No |




---

### `badgeColor`

Background color for the badge. Available since iOS 10.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |




---

### `selectedIcon`

A custom icon when the tab is selected. It is ignored when a system
icon is defined. If left empty, the icon will be tinted in blue.

| Type | Required |
| - | - |
| [Image.propTypes.source](docs/image.html#source) | No |




---

### `style`

React style object.

| Type | Required |
| - | - |
| [ViewPropTypes.style](docs/viewproptypes.html#style) | No |




---

### `systemIcon`

Items comes with a few predefined system icons. Note that if you are
using them, the title and selectedIcon will be overridden with the
system ones.

| Type | Required |
| - | - |
| enum('bookmarks', 'contacts', 'downloads', 'favorites', 'featured', 'history', 'more', 'most-recent', 'most-viewed', 'recents', 'search', 'top-rated') | No |


---

### `title`

Text that appears under the icon. It is ignored when a system icon
is defined.

| Type | Required |
| - | - |
| string | No |




---

### `isTVSelectable`

(Apple TV only)* When set to true, this view will be focusable
and navigable using the Apple TV remote.



| Type | Required | Platform |
| - | - | - |
| bool | No | iOS  |






