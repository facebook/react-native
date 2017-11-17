---
id: accessibilityinfo
title: AccessibilityInfo
layout: docs
category: APIs
permalink: docs/accessibilityinfo.html
next: actionsheetios
previous: webview
---

Sometimes it's useful to know whether or not the device has a screen reader that is currently active. The
`AccessibilityInfo` API is designed for this purpose. You can use it to query the current state of the
screen reader as well as to register to be notified when the state of the screen reader changes.

Here's a small example illustrating how to use `AccessibilityInfo`:

```javascript
class ScreenReaderStatusExample extends React.Component {
  state = {
    screenReaderEnabled: false,
  }

  componentDidMount() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleScreenReaderToggled
    );
    AccessibilityInfo.fetch().done((isEnabled) => {
      this.setState({
        screenReaderEnabled: isEnabled
      });
    });
  }

  componentWillUnmount() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleScreenReaderToggled
    );
  }

  _handleScreenReaderToggled = (isEnabled) => {
    this.setState({
      screenReaderEnabled: isEnabled,
    });
  }

  render() {
    return (
      <View>
        <Text>
          The screen reader is {this.state.screenReaderEnabled ? 'enabled' : 'disabled'}.
        </Text>
      </View>
    );
  }
}
```


### Methods

- [`fetch`](docs/accessibilityinfo.html#fetch)
- [`addEventListener`](docs/accessibilityinfo.html#addeventlistener)
- [`setAccessibilityFocus`](docs/accessibilityinfo.html#setaccessibilityfocus)
- [`announceForAccessibility`](docs/accessibilityinfo.html#announceforaccessibility)
- [`removeEventListener`](docs/accessibilityinfo.html#removeeventlistener)




---

# Reference

## Methods

### `fetch()`

```javascript
AccessibilityInfo.fetch(): Promise
```


Query whether a screen reader is currently enabled. Returns a promise which
resolves to a boolean. The result is `true` when a screen reader is enabled
and `false` otherwise.




---

### `addEventListener()`

```javascript
AccessibilityInfo.addEventListener(eventName: ChangeEventName, handler: Function): Object
```

Add an event handler. See [Change Event Names](docs/accessibilityinfo.html#changeeventnames).


---

### `setAccessibilityFocus()`

```javascript
AccessibilityInfo.setAccessibilityFocus(reactTag: number): void
```

Set accessibility focus to a React component.


| Platform |
| - |
| iOS |




---

### `announceForAccessibility()`

```javascript
AccessibilityInfo.announceForAccessibility(announcement: string): void
```

Post a string to be announced by the screen reader.

| Platform |
| - |
| iOS |



---

### `removeEventListener()`

```javascript
AccessibilityInfo.removeEventListener(eventName: ChangeEventName, handler)
```

Remove an event handler. See [Change Event Names](docs/accessibilityinfo.html#changeeventnames).



## Change Event Names

### `change`

Fires when the state of the screen reader changes. The argument to the event handler is a boolean. The boolean is `true` when a screen reader is enabled and `false` otherwise.

### `announcementFinished`

Fires when the screen reader has finished making an announcement. The argument to the event handler is a dictionary with these keys:

  - `announcement`: The string announced by the screen reader.
  - `success`: A boolean indicating whether the announcement was successfully made.

| Platform |
| - |
| iOS |
