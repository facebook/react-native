/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

import React from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';

const RNTesterDocumentationURL = ({documentationURL}) => (
  <TouchableOpacity
    style={styles.container}
    onPress={() => openURLInBrowser(documentationURL)}>
    <Image
      source={require('../assets/documentation.png')}
      style={styles.icon}
    />
  </TouchableOpacity>
);

export default RNTesterDocumentationURL;

const styles = StyleSheet.create({
  container: {
    textDecorationLine: 'underline',
    position: 'absolute',
    bottom: 0,
    right: -15,
  },
  icon: {
    height: 24,
  },
});
