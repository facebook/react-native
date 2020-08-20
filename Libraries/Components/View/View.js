/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @generate-docs
 */

'use strict';

import type {ViewProps} from './ViewPropTypes';

const React = require('react');
import ViewNativeComponent from './ViewNativeComponent';
const TextAncestor = require('../../Text/TextAncestor');

export type Props = ViewProps;

/**
  The most fundamental component for building a UI, `View` is a container that
  supports layout with [flexbox](flexbox.md), [style](style.md), [some touch
  handling](handling-touches.md), and [accessibility](accessibility.md)
  controls. `View` maps directly to the native view equivalent on whatever
  platform React Native is running on, whether that is a `UIView`, `<div>`,
  `android.view`, etc.

  `View` is designed to be nested inside other views and can have 0 to many
  children of any type.

  This example creates a `View` that wraps two boxes with color and a text
  component in a row with padding.

  ```SnackPlayer name=View%20Function%20Component%20Example
  import React from "react";
  import { View, Text } from "react-native";

  const ViewBoxesWithColorAndText = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          height: 100,
          padding: 20
        }}
      >
        <View style={{ backgroundColor: "blue", flex: 0.3 }} />
        <View style={{ backgroundColor: "red", flex: 0.5 }} />
        <Text>Hello World!</Text>
      </View>
    );
  };

  export default ViewBoxesWithColorAndText;
  ```

  ```SnackPlayer name=View%20Class%20Component%20Example
  import React, { Component } from "react";
  import { View, Text } from "react-native";

  class App extends Component {
    render() {
      return (
        <View
          style={{
            flexDirection: "row",
            height: 100,
            padding: 20
          }}
        >
          <View style={{ backgroundColor: "blue", flex: 0.3 }} />
          <View style={{ backgroundColor: "red", flex: 0.5 }} />
          <Text>Hello World!</Text>
        </View>
      );
    }
  }

  export default App;
  ```

  > `View`s are designed to be used with [`StyleSheet`](style.md) for clarity
  and performance, although inline styles are also supported.

  ### Synthetic Touch Events
  For `View` responder props (e.g., `onResponderMove`), the synthetic touch event
  passed to them are in form of [PressEvent](pressevent).
 */
const View: React.AbstractComponent<
  ViewProps,
  React.ElementRef<typeof ViewNativeComponent>,
> = React.forwardRef((props: ViewProps, forwardedRef) => {
  return (
    <TextAncestor.Provider value={false}>
      <ViewNativeComponent {...props} ref={forwardedRef} />
    </TextAncestor.Provider>
  );
});

View.displayName = 'View';

module.exports = View;
