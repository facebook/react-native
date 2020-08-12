/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {View, ImageBackground} from 'react-native';

type Props = $ReadOnly<{|
  children?: React.Node,
  height: number,
  width: number,
|}>;

export default function Background(props: Props): React.Node {
  const BACKGROUND_URL = require('../assets/BackgroundScreen.png');

  return (
    <View>
      <ImageBackground
        style={{height: props.height, width: props.width}}
        source={BACKGROUND_URL}
      />
      {props.children}
    </View>
  );
}
