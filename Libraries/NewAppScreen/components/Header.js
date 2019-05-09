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
import {View, Text, StyleSheet, ImageBackground} from 'react-native';
import Colors from './Colors';

const Header = () => (
  <View style={styles.container}>
    <ImageBackground
      accessibilityRole={'image'}
      source={require('./logo.png')}
      style={styles.background}
      imageStyle={styles.logo}>
      <Text style={styles.text}>Welcome to React Native</Text>
    </ImageBackground>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lighter,
  },
  background: {
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  logo: {
    opacity: 0.2,
  },
  text: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.black,
  },
});

export default Header;
