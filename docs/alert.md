---
id: alert
title: Alert
layout: docs
category: APIs
permalink: docs/alert.html
next: alertios
previous: actionsheetios
---

Use `Alert` to display an alert dialog.

This is an API that works both on iOS and Android and can show static alerts. To show an alert that prompts the user to enter some information, see [`AlertIOS`](docs/alertios.html), as entering text in an alert is common on iOS only.

Optionally provide a list of buttons. Tapping any button will fire the respective `onPress` callback, and dismiss the alert. If no buttons are provided, a single 'OK' button will be displayed by default. 

On iOS, you can specify any number of buttons.

On Android, at most three buttons can be specified. Android has a concept of a neutral, negative and a positive button:

- If you specify one button, it will be the 'positive' one (such as 'OK')
- Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')
- Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')

Alerts on Android can be dismissed by tapping outside of the alert box. This event can be handled by providing an optional `options` parameter, with an `onDismiss` callback property `{ onDismiss: () => {} }`.

Alternatively, the dismissing behavior can be disabled altogether by providing an optional `options` parameter with the `cancelable` property set to `false`, i.e. `{ cancelable: false }`

Example usage:

```
// Works on both iOS and Android
Alert.alert(
  'Alert Title',
  'My Alert Msg',
  [
    {text: 'Ask me later', onPress: () => console.log('Ask me later pressed')},
    {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
    {text: 'OK', onPress: () => console.log('OK Pressed')},
  ],
  { cancelable: false }
)
```

### Methods

- [`alert`](docs/alert.html#alert)

---

# Reference

## Methods

### `alert()`

```javascript
Alert.alert(title, [message], [buttons], [options])
```

Launches an alert dialog with the specified title, and optionally a message.

| Name | Type | Required | Description |
| - | - | - | - |
| title | string | Yes | Alert title |
| message | string | No | Alert message |
| buttons | array | No | Array of buttons |
| options | object | No | See below. |

The optional `buttons` array should be composed of objects with any of the following:

- `text` (string) - text to display for this button
- `onPress` (function) - callback to be fired when button is tapped
- `style` (string) - on iOS, specifies the button style, one of 'default', 'cancel', or 'destructive'

The `options` object may include the following keys:

- `onDismiss` - provide a callback function to handle dismissal on Android
- `cancelable` - set to false to disable the default dismissal behavior on Android
