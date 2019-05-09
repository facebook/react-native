/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import React from 'react';
import {Text, StyleSheet, ImageBackground} from 'react-native';
import Colors from './Colors';

const Header = () => (
  <ImageBackground
    accessibilityRole={'image'}
    source={require('./logo.png')}
    style={styles.background}
    imageStyle={styles.logo}>
    <Text style={styles.text}>Welcome to React Native</Text>
  </ImageBackground>
);

const styles = StyleSheet.create({
  background: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    backgroundColor: Colors.lighter,
  },
  logo: {
    opacity: 0.2,
    overflow: 'visible',
    resizeMode: 'cover',
    /*
     * These negative margins allow the image to be offset similarly across screen sizes and component sizes.
     *
     * The source logo.png image is 512x512px. `marginLeft` of `-128` offsets the image offscreen to the left
     * by a quarter of the image, while marginBottom of `-192` offsets the image such that the center of the logo
     * intersects with the bottom of the view.
     */
    marginLeft: -128,
    marginBottom: -192,
  },
  text: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.black,
  },
});

export default Header;
