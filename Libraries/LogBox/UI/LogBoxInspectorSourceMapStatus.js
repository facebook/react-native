/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Animated from '../../Animated/Animated';
import Easing from '../../Animated/Easing';
import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';

import type {PressEvent} from '../../Types/CoreEventTypes';

type Props = $ReadOnly<{|
  onPress?: ?(event: PressEvent) => void,
  status: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING',
|}>;

function LogBoxInspectorSourceMapStatus(props: Props): React.Node {
  const [state, setState] = React.useState({
    animation: null,
    rotate: null,
  });

  React.useEffect(() => {
    if (props.status === 'PENDING') {
      if (state.animation == null) {
        const animated = new Animated.Value(0);
        const animation = Animated.loop(
          Animated.timing(animated, {
            duration: 2000,
            // $FlowFixMe[method-unbinding]
            easing: Easing.linear,
            toValue: 1,
            useNativeDriver: true,
          }),
        );
        setState({
          animation,
          rotate: animated.interpolate({
            inputRange: [0, 1],
            /* $FlowFixMe[speculation-ambiguous] (>=0.38.0) - Flow error
             * detected during the deployment of v0.38.0. To see the error,
             * remove this comment and run flow */
            outputRange: ['0deg', '360deg'],
          }),
        });
        animation.start();
      }
    } else {
      if (state.animation != null) {
        state.animation.stop();
        setState({
          animation: null,
          rotate: null,
        });
      }
    }

    return () => {
      if (state.animation != null) {
        state.animation.stop();
      }
    };
  }, [props.status, state.animation]);

  let image;
  let color;
  switch (props.status) {
    case 'FAILED':
      image = require('./LogBoxImages/alert-triangle.png');
      color = LogBoxStyle.getErrorColor(1);
      break;
    case 'PENDING':
      image = require('./LogBoxImages/loader.png');
      color = LogBoxStyle.getWarningColor(1);
      break;
  }

  if (props.status === 'COMPLETE' || image == null) {
    return null;
  }

  return (
    <LogBoxButton
      backgroundColor={{
        default: 'transparent',
        pressed: LogBoxStyle.getBackgroundColor(1),
      }}
      hitSlop={{bottom: 8, left: 8, right: 8, top: 8}}
      onPress={props.onPress}
      style={styles.root}>
      <Animated.Image
        source={image}
        style={[
          styles.image,
          {tintColor: color},
          state.rotate == null || props.status !== 'PENDING'
            ? null
            : {transform: [{rotate: state.rotate}]},
        ]}
      />
      <Text style={[styles.text, {color}]}>Source Map</Text>
    </LogBoxButton>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    paddingHorizontal: 8,
  },
  image: {
    height: 14,
    width: 16,
    marginEnd: 4,
    tintColor: LogBoxStyle.getTextColor(0.4),
  },
  text: {
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
});

export default LogBoxInspectorSourceMapStatus;
