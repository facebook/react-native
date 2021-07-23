/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @generate-docs
 */

'use strict';

const Image = require('./Image');
const React = require('react');
const StyleSheet = require('../StyleSheet/StyleSheet');
const View = require('../Components/View/View');

/**
  A common feature request from developers familiar with the web is
  `background-image`. To handle this use case, you can use the
  `<ImageBackground>` component, which has the same props as `<Image>`, and add
  whatever children to it you would like to layer on top of it.

  You might not want to use `<ImageBackground>` in some cases, since the
  implementation is basic. Refer to `<ImageBackground>`'s
  [source code][react-native:ImageBackground] for more insight, and create your
  own custom component when needed.

  [react-native:ImageBackground]:
  https://github.com/facebook/react-native/blob/master/Libraries/Image/ImageBackground.js

  Note that you must specify some width and height style attributes.

  ```SnackPlayer name=ImageBackground
  import React from "react";
  import { ImageBackground, StyleSheet, Text, View } from "react-native";

  const image = { uri: "https://reactjs.org/logo-og.png" };

  const App = () => (
    <View style={styles.container}>
      <ImageBackground source={image} style={styles.image}>
        <Text style={styles.text}>Inside</Text>
      </ImageBackground>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: "column"
    },
    image: {
      flex: 1,
      resizeMode: "cover",
      justifyContent: "center"
    },
    text: {
      color: "grey",
      fontSize: 30,
      fontWeight: "bold"
    }
  });

  export default App;
  ```
 */
class ImageBackground extends React.Component<$FlowFixMeProps> {
  setNativeProps(props: Object) {
    // Work-around flow
    const viewRef = this._viewRef;
    if (viewRef) {
      viewRef.setNativeProps(props);
    }
  }

  _viewRef: ?React.ElementRef<typeof View> = null;

  _captureRef = ref => {
    this._viewRef = ref;
  };

  render(): React.Node {
    const {children, style, imageStyle, imageRef, ...props} = this.props;

    return (
      <View
        accessibilityIgnoresInvertColors={true}
        style={style}
        ref={this._captureRef}>
        <Image
          {...props}
          style={[
            StyleSheet.absoluteFill,
            {
              // Temporary Workaround:
              // Current (imperfect yet) implementation of <Image> overwrites width and height styles
              // (which is not quite correct), and these styles conflict with explicitly set styles
              // of <ImageBackground> and with our internal layout model here.
              // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
              // This workaround should be removed after implementing proper support of
              // intrinsic content size of the <Image>.
              width: style.width,
              height: style.height,
            },
            imageStyle,
          ]}
          ref={imageRef}
        />
        {children}
      </View>
    );
  }
}

module.exports = ImageBackground;
