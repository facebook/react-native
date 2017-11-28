---
id: appstate
title: AppState
layout: docs
category: APIs
permalink: docs/appstate.html
next: asyncstorage
previous: appregistry
---

`AppState` can tell you if the app is in the foreground or background, and notify you when the state changes.

App state is frequently used to determine the intent and proper behavior when handling push notifications.

### App States

- `active` - The app is running in the foreground
- `background` - The app is running in the background. The user is either
  in another app or on the home screen
- `inactive` - This is a state that occurs when transitioning between foreground & background, and during periods of inactivity such as entering the Multitasking view or in the event of an incoming call

For more information, see [Apple's documentation](https://developer.apple.com/library/ios/documentation/iPhone/Conceptual/iPhoneOSProgrammingGuide/TheAppLifeCycle/TheAppLifeCycle.html).

### Basic Usage

To see the current state, you can check `AppState.currentState`, which will be kept up-to-date. However, `currentState` will be null at launch while `AppState` retrieves it over the bridge.

```javascript
import React, {Component} from 'react'
import {AppState, Text} from 'react-native'

class AppStateExample extends Component {

  state = {
    appState: AppState.currentState
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
    }
    this.setState({appState: nextAppState});
  }

  render() {
    return (
      <Text>Current state is: {this.state.appState}</Text>
    );
  }

}
```

This example will only ever appear to say "Current state is: active" because the app is only visible to the user when in the `active` state, and the null state will happen only momentarily.


### Methods

- [`addEventListener`](docs/appstate.html#addeventlistener)
- [`removeEventListener`](docs/appstate.html#removeeventlistener)


---

# Reference

## Methods

### `addEventListener()`

```javascript
addEventListener(type, handler)
```

Add a handler to AppState changes by listening to the `change` event type and providing the handler.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| type | string | Yes |  |
| handler | function | Yes |  |

---

### `removeEventListener()`

```javascript
removeEventListener(type, handler)
```

Remove a handler by passing the `change` event type and the handler.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| type | string | Yes |  |
| handler | function | Yes |  |
