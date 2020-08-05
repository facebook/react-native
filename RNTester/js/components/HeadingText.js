/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import * as React from 'react';
import {StyleSheet, Text} from 'react-native';

type Props = $ReadOnly<{|
  text?: ?string,
|}>;

export default function HeadingText(props: Props): React.Node {
  return <Text style={[styles.text]}>{props.text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    fontWeight: '500',
    // fontFamily: 'PlayfairDisplay-Regular',
    // we can link the font family once the migration has been completed
  },
});
