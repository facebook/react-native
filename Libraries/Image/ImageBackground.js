/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ImageBackground
 * @flow
 * @format
 */
'use strict';

const Image = require('Image');
const React = require('React');
const View = require('View');

/**
 * Very simple drop-in replacement for <Image> which supports nesting views.
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, ImageBackground, Text } from 'react-native';
 *
 * class DisplayAnImageBackground extends Component {
 *   render() {
 *     return (
 *       <ImageBackground
 *         style={{width: 50, height: 50}}
 *         source={{uri: 'https://facebook.github.io/react/img/logo_og.png'}}
 *       >
 *         <Text>React</Text>
 *       </ImageBackground>
 *     );
 *   }
 * }
 *
 * // App registration and rendering
 * AppRegistry.registerComponent('DisplayAnImageBackground', () => DisplayAnImageBackground);
 * ```
 */
class ImageBackground extends React.Component {
  render() {
    const {children, style, imageStyle, imageRef, ...props} = this.props;

    return (
      <View style={style}>
        <Image
          {...props}
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
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
