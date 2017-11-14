---
id: picker-item
title: Picker.Item
---

Individual selectable item in a [Picker](docs/picker.html).

### Props

- [`label`](docs/picker-item.html#label)
- [`color`](docs/picker-item.html#color)
- [`testID`](docs/picker-item.html#testid)
- [`value`](docs/picker-item.html#value)

---

# Reference

## Props

### `label`

Text to display for this item.

| Type | Required |
| - | - |
| string | Yes |

### `color`

The value to be passed to picker's `onValueChange` callback when this item is selected. Can be a string or an integer.

| Type | Required |
| - | - |
| [color](docs/colors.html) | No |

### `testID`

Used to locate the item in end-to-end tests.

| Type | Required |
| - | - |
| string | No |

### `value`

Color of this item's text.

| Type | Required | Platform |
| - | - | - |
| any | No | Android |

