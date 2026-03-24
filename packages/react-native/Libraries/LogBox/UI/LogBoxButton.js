/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';

import TouchableWithoutFeedback from '../../Components/Touchable/TouchableWithoutFeedback';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useState} from 'react';

component LogBoxButton(
  id?: string,
  backgroundColor: Readonly<{
    default: string,
    pressed: string,
  }>,
  children?: React.Node,
  hitSlop?: ?EdgeInsetsProp,
  onPress?: ?(event: GestureResponderEvent) => void,
  style?: ViewStyleProp,
) {
  const [pressed, setPressed] = useState(false);

  let resolvedBackgroundColor = backgroundColor;
  if (!resolvedBackgroundColor) {
    resolvedBackgroundColor = {
      default: LogBoxStyle.getBackgroundColor(0.95),
      pressed: LogBoxStyle.getBackgroundColor(0.6),
    };
  }

  const content = (
    <View
      id={id}
      style={StyleSheet.compose(
        {
          backgroundColor: pressed
            ? resolvedBackgroundColor.pressed
            : resolvedBackgroundColor.default,
        },
        style,
      )}>
      {children}
    </View>
  );

  return onPress == null ? (
    content
  ) : (
    <TouchableWithoutFeedback
      hitSlop={hitSlop}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}>
      {content}
    </TouchableWithoutFeedback>
  );
}

export default LogBoxButton;
