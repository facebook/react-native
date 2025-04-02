/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import Platform from '../../Utilities/Platform';
import * as React from 'react';

const styles = StyleSheet.create({
  highlight: {
    fontWeight: '700',
  },
});

const ReloadInstructions: () => React.Node = Platform.select({
  ios: () => (
    <Text>
      Press <Text style={styles.highlight}>Cmd + R</Text> in the simulator to
      reload your app's code.
    </Text>
  ),
  default: () => (
    <Text>
      Double tap <Text style={styles.highlight}>R</Text> on your keyboard to
      reload your app's code.
    </Text>
  ),
});

export default ReloadInstructions;
