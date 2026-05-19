/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useMemo, useRef, useState} from 'react';
import {PanResponder, StyleSheet, View} from 'react-native';

const CIRCLE_SIZE = 80;

function PanResponderExample() {
  const [position, setPosition] = useState({left: 20, top: 84});
  const [pressed, setPressed] = useState(false);
  const circleRef = useRef<?React.ElementRef<typeof View>>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          setPressed(true);
        },
        onPanResponderMove: (evt, gestureState) => {
          setPosition({
            left: position.left + gestureState.dx,
            top: position.top + gestureState.dy,
          });
        },
        onPanResponderRelease: () => {
          setPressed(false);
        },
      }),
    [position],
  );
  return (
    <View style={styles.container}>
      <View
        ref={circleRef}
        style={[
          styles.circle,
          {
            transform: [
              {translateX: position.left},
              {translateY: position.top},
            ],
            backgroundColor: pressed ? 'blue' : 'green',
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 500,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

exports.title = 'PanResponder Sample';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/panresponder';
exports.description =
  'Shows the Use of PanResponder to provide basic gesture handling';
exports.examples = [
  {
    title: 'Basic gesture handling',
    description: 'Press and drag circle around',
    render(): React.MixedElement {
      return <PanResponderExample />;
    },
  },
] as Array<RNTesterModuleExample>;
