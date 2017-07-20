---
id: direct-manipulation
title: Direct Manipulation
layout: docs
category: Guides
permalink: docs/direct-manipulation.html
next: colors
previous: javascript-environment
---

It is sometimes necessary to make changes directly to a component
without using state/props to trigger a re-render of the entire subtree.
When using React in the browser for example, you sometimes need to
directly modify a DOM node, and the same is true for views in mobile
apps. `setNativeProps` is the React Native equivalent to setting
properties directly on a DOM node.

> Use setNativeProps when frequent re-rendering creates a performance bottleneck
>
> Direct manipulation will not be a tool that you reach for
> frequently; you will typically only be using it for creating
> continuous animations to avoid the overhead of rendering the component
> hierarchy and reconciling many views. `setNativeProps` is imperative
> and stores state in the native layer (DOM, UIView, etc.) and not
> within your React components, which makes your code more difficult to
> reason about. Before you use it, try to solve your problem with `setState`
> and [shouldComponentUpdate](http://facebook.github.io/react/docs/advanced-performance.html#shouldcomponentupdate-in-action).

## setNativeProps with TouchableOpacity

[TouchableOpacity](https://github.com/facebook/react-native/blob/master/Libraries/Components/Touchable/TouchableOpacity.js)
uses `setNativeProps` internally to update the opacity of its child
component:

```javascript
setOpacityTo(value) {
  // Redacted: animation related code
  this.refs[CHILD_REF].setNativeProps({
    opacity: value
  });
},
```

This allows us to write the following code and know that the child will
have its opacity updated in response to taps, without the child having
any knowledge of that fact or requiring any changes to its implementation:

```javascript
<TouchableOpacity onPress={this._handlePress}>
  <View style={styles.button}>
    <Text>Press me!</Text>
  </View>
</TouchableOpacity>
```

Let's imagine that `setNativeProps` was not available. One way that we
might implement it with that constraint is to store the opacity value
in the state, then update that value whenever `onPress` is fired:

```javascript
constructor(props) {
  super(props);
  this.state = { myButtonOpacity: 1, };
}

render() {
  return (
    <TouchableOpacity onPress={() => this.setState({myButtonOpacity: 0.5})}
                      onPressOut={() => this.setState({myButtonOpacity: 1})}>
      <View style={[styles.button, {opacity: this.state.myButtonOpacity}]}>
        <Text>Press me!</Text>
      </View>
    </TouchableOpacity>
  )
}
```

This is computationally intensive compared to the original example -
React needs to re-render the component hierarchy each time the opacity
changes, even though other properties of the view and its children
haven't changed. Usually this overhead isn't a concern but when
performing continuous animations and responding to gestures, judiciously
optimizing your components can improve your animations' fidelity.

If you look at the implementation of `setNativeProps` in
[NativeMethodsMixin.js](https://github.com/facebook/react/blob/master/src/renderers/native/NativeMethodsMixin.js)
you will notice that it is a wrapper around `RCTUIManager.updateView` -
this is the exact same function call that results from re-rendering -
see [receiveComponent in
ReactNativeBaseComponent.js](https://github.com/facebook/react/blob/master/src/renderers/native/ReactNativeBaseComponent.js).

## Composite components and setNativeProps

Composite components are not backed by a native view, so you cannot call
`setNativeProps` on them. Consider this example:

```SnackPlayer?name=setNativeProps%20with%20Composite%20Components
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

class MyButton extends React.Component {
  render() {
    return (
      <View>
        <Text>{this.props.label}</Text>
      </View>
    )
  }
}

export default class App extends React.Component {
  render() {
    return (
      <TouchableOpacity>
        <MyButton label="Press me!" />
      </TouchableOpacity>
    )
  }
}
```

If you run this you will immediately see this error: `Touchable child
must either be native or forward setNativeProps to a native component`.
This occurs because `MyButton` isn't directly backed by a native view
whose opacity should be set. You can think about it like this: if you
define a component with `createReactClass` you would not expect to be
able to set a style prop on it and have that work - you would need to
pass the style prop down to a child, unless you are wrapping a native
component. Similarly, we are going to forward `setNativeProps` to a
native-backed child component.

#### Forward setNativeProps to a child

All we need to do is provide a `setNativeProps` method on our component
that calls `setNativeProps` on the appropriate child with the given
arguments.

```SnackPlayer?name=Forwarding%20setNativeProps
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

class MyButton extends React.Component {
  setNativeProps = (nativeProps) => {
    this._root.setNativeProps(nativeProps);
  }

  render() {
    return (
      <View ref={component => this._root = component} {...this.props}>
        <Text>{this.props.label}</Text>
      </View>
    )
  }
}

export default class App extends React.Component {
  render() {
    return (
      <TouchableOpacity>
        <MyButton label="Press me!" />
      </TouchableOpacity>
    )
  }
}
```

You can now use `MyButton` inside of `TouchableOpacity`! A sidenote for
clarity: we used the [ref callback](https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute) syntax here, rather than the traditional string-based ref.

You may have noticed that we passed all of the props down to the child
view using `{...this.props}`. The reason for this is that
`TouchableOpacity` is actually a composite component, and so in addition
to depending on `setNativeProps` on its child, it also requires that the
child perform touch handling. To do this, it passes on [various
props](docs/view.html#onmoveshouldsetresponder)
that call back to the `TouchableOpacity` component.
`TouchableHighlight`, in contrast, is backed by a native view and only
requires that we implement `setNativeProps`.

## setNativeProps to clear TextInput value

Another very common use case of `setNativeProps` is to clear the value
of a TextInput. The `controlled` prop of TextInput can sometimes drop
characters when the `bufferDelay` is low and the user types very
quickly. Some developers prefer to skip this prop entirely and instead
use `setNativeProps` to directly manipulate the TextInput value when
necessary. For example, the following code demonstrates clearing the
input when you tap a button:

```SnackPlayer?name=Clear%20text
import React from 'react';
import { TextInput, Text, TouchableOpacity, View } from 'react-native';

export default class App extends React.Component {
  clearText = () => {
    this._textInput.setNativeProps({text: ''});
  }

  render() {
    return (
      <View style={{flex: 1}}>
        <TextInput
          ref={component => this._textInput = component}
          style={{height: 50, flex: 1, marginHorizontal: 20, borderWidth: 1, borderColor: '#ccc'}}
        />
        <TouchableOpacity onPress={this.clearText}>
          <Text>Clear text</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
```

## Avoiding conflicts with the render function

If you update a property that is also managed by the render function,
you might end up with some unpredictable and confusing bugs because
anytime the component re-renders and that property changes, whatever
value was previously set from `setNativeProps` will be completely
ignored and overridden.

## setNativeProps & shouldComponentUpdate

By [intelligently applying
`shouldComponentUpdate`](https://facebook.github.io/react/docs/advanced-performance.html#avoiding-reconciling-the-dom)
you can avoid the unnecessary overhead involved in reconciling unchanged
component subtrees, to the point where it may be performant enough to
use `setState` instead of `setNativeProps`.

## Other native methods

The methods described here are available on most of the default components provided by React Native. Note, however, that they are *not* available on composite components that aren't directly backed by a native view. This will generally include most components that you define in your own app.

### measure(callback)

Determines the location on screen, width, and height of the given view and returns the values via an async callback. If successful, the callback will be called with the following arguments:

* x
* y
* width
* height
* pageX
* pageY

Note that these measurements are not available until after the rendering has been completed in native. If you need the measurements as soon as possible, consider using the [`onLayout` prop](docs/view.html#onlayout) instead.

### measureInWindow(callback)

Determines the location of the given view in the window and returns the values via an async callback. If the React root view is embedded in another native view, this will give you the absolute coordinates. If successful, the callback will be called with the following arguments:

* x
* y
* width
* height

### measureLayout(relativeToNativeNode, onSuccess, onFail)

Like `measure()`, but measures the view relative an ancestor, specified as `relativeToNativeNode`. This means that the returned x, y are relative to the origin x, y of the ancestor view.

As always, to obtain a native node handle for a component, you can use `ReactNative.findNodeHandle(component)`.

### focus()

Requests focus for the given input or view. The exact behavior triggered will depend on the platform and type of view.

### blur()

Removes focus from an input or view. This is the opposite of `focus()`.
