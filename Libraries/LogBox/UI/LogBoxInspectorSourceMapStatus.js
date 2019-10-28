/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import Animated from '../../Animated/src/Animated';
import Easing from '../../Animated/src/Easing';
import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxImageSource from './LogBoxImageSource';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';

import type {CompositeAnimation} from '../../Animated/src/AnimatedImplementation';
import type AnimatedInterpolation from '../../Animated/src/nodes/AnimatedInterpolation';
import type {PressEvent} from '../../Types/CoreEventTypes';

type Props = $ReadOnly<{|
  onPress?: ?(event: PressEvent) => void,
  status: 'COMPLETE' | 'FAILED' | 'NONE' | 'PENDING',
|}>;

type State = {|
  animation: ?CompositeAnimation,
  rotate: ?AnimatedInterpolation,
|};

class LogBoxInspectorSourceMapStatus extends React.Component<Props, State> {
  state: State = {
    animation: null,
    rotate: null,
  };

  render(): React.Node {
    let image;
    let color;
    switch (this.props.status) {
      case 'COMPLETE':
        image = LogBoxImageSource.check;
        color = LogBoxStyle.getTextColor(0.4);
        break;
      case 'FAILED':
        image = LogBoxImageSource.alertTriangle;
        color = LogBoxStyle.getErrorColor(1);
        break;
      case 'PENDING':
        image = LogBoxImageSource.loader;
        color = LogBoxStyle.getWarningColor(1);
        break;
    }

    return image == null ? null : (
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundColor(1),
        }}
        hitSlop={{bottom: 8, left: 8, right: 8, top: 8}}
        onPress={this.props.onPress}
        style={styles.root}>
        <Animated.Image
          source={{height: 16, uri: image, width: 16}}
          style={[
            styles.image,
            {tintColor: color},
            this.state.rotate == null
              ? null
              : {transform: [{rotate: this.state.rotate}]},
          ]}
        />
        <Text style={[styles.text, {color}]}>Source Map</Text>
      </LogBoxButton>
    );
  }

  componentDidMount(): void {
    this._updateAnimation();
  }

  componentDidUpdate(): void {
    this._updateAnimation();
  }

  componentWillUnmount(): void {
    if (this.state.animation != null) {
      this.state.animation.stop();
    }
  }

  _updateAnimation(): void {
    if (this.props.status === 'PENDING') {
      if (this.state.animation == null) {
        const animated = new Animated.Value(0);
        const animation = Animated.loop(
          Animated.timing(animated, {
            duration: 2000,
            easing: Easing.linear,
            toValue: 1,
            useNativeDriver: true,
          }),
        );
        this.setState(
          {
            animation,
            rotate: animated.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
          () => {
            animation.start();
          },
        );
      }
    } else {
      if (this.state.animation != null) {
        this.state.animation.stop();
        this.setState({
          animation: null,
          rotate: null,
        });
      }
    }
  }
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
