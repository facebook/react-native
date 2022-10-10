/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import * as React from 'react';
import {StyleSheet} from 'react-native';
import NativeComponentWithState from '../../../NativeComponentWithState/js/NativeComponentWithState';

const styles = StyleSheet.create({
  component: {
    marginLeft: 150,
    width: 100,
    height: 100,
    marginTop: 20,
  },
});

exports.title = 'Component with State';
exports.description =
  'Codegen discovery must be enabled for iOS. See Podfile for more details. Component with State';
exports.examples = [
  {
    title: 'Component with State',
    description:
      'Change the image source in the Examples/NewArchitecture/ComponentWithState.js file',
    render(): React.Element<any> {
      return (
        <>
          <NativeComponentWithState
            imageSource={{
              uri: 'https://reactnative.dev/img/tiny_logo.png',
            }}
            style={styles.component}
          />
        </>
      );
    },
  },
];
