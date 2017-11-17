---
id: actionsheetios
title: ActionSheetIOS
layout: docs
category: APIs
permalink: docs/actionsheetios.html
next: alert
previous: accessibilityinfo
---

Display action sheets and share sheets on iOS.

### Methods

- [`showActionSheetWithOptions`](docs/actionsheetios.html#showactionsheetwithoptions)
- [`showShareActionSheetWithOptions`](docs/actionsheetios.html#showshareactionsheetwithoptions)




---

# Reference

## Methods

### `showActionSheetWithOptions()`

```javascript
ActionSheetIOS.showActionSheetWithOptions(options, callback)
```

Display an iOS action sheet. 

| Name | Type | Required | Description |
| - | - | - | - |
| options | object | Yes |  |
| callback | function | Yes | Provides index for the selected item |

The `options` object must contain one or more of:

- `options` (array of strings) - a list of button titles (required)
- `cancelButtonIndex` (int) - index of cancel button in `options`
- `destructiveButtonIndex` (int) - index of destructive button in `options`
- `title` (string) - a title to show above the action sheet
- `message` (string) - a message to show below the title

The 'callback' function takes one parameter, the zero-based index
of the selected item.

Minimal example:

```
ActionSheetIOS.showActionSheetWithOptions({
  options: ['Remove', 'Cancel'],
  destructiveButtonIndex: 1,
  cancelButtonIndex: 0,
},
(buttonIndex) => {
  if (buttonIndex === 1) { // destructive action }
});
```

---

### `showShareActionSheetWithOptions()`

```javascript
ActionSheetIOS.showShareActionSheetWithOptions(options, failureCallback, successCallback)
```

Display the iOS share sheet. 

| Name | Type | Required | Description |
| - | - | - | - |
| options | object | Yes |  |
| failureCallback | function | Yes |  |
| successCallback | function | Yes |  |

The `options` object should contain one or both of `message` and `url` and can additionally have a `subject` or `excludedActivityTypes`:

- `url` (string) - a URL to share
- `message` (string) - a message to share
- `subject` (string) - a subject for the message
- `excludedActivityTypes` (array) - the activities to exclude from the ActionSheet

> NOTE:
> If `url` points to a local file, or is a base64-encoded uri, the file it points to will be loaded and shared directly. In this way, you can share images, videos, PDF files, etc.

The 'failureCallback' function takes one parameter, an error object. The only property defined on this object is an optional `stack` property of type `string`.

The 'successCallback' function takes two parameters:

- a boolean value signifying success or failure
- a string that, in the case of success, indicates the method of sharing

