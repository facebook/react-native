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

const Animated = require('../../Animated/src/Animated');
const Easing = require('../../Animated/src/Easing');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Text = require('../../Text/Text');
const YellowBoxImageSource = require('./YellowBoxImageSource');
const YellowBoxPressable = require('./YellowBoxPressable');
const YellowBoxStyle = require('./YellowBoxStyle');

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

class YellowBoxInspectorSourceMapStatus extends React.Component<Props, State> {
  state: State = {
    animation: null,
    rotate: null,
  };

  render(): React.Node {
    let image;
    switch (this.props.status) {
      case 'COMPLETE':
        image = YellowBoxImageSource.check;
        break;
      case 'FAILED':
        image = YellowBoxImageSource.alertTriangle;
        break;
      case 'PENDING':
        image = YellowBoxImageSource.loader;
        break;
    }

    return image == null ? null : (
      <YellowBoxPressable
        backgroundColor={{
          default: YellowBoxStyle.getTextColor(0.8),
          pressed: YellowBoxStyle.getTextColor(0.6),
        }}
        hitSlop={{bottom: 8, left: 8, right: 8, top: 8}}
        onPress={this.props.onPress}
        style={StyleSheet.compose(
          styles.root,
          this.props.status === 'PENDING' ? styles.pending : null,
        )}>
        <Animated.Image
          source={{height: 16, uri: image, width: 16}}
          style={StyleSheet.compose(
            styles.image,
            this.state.rotate == null
              ? null
              : {transform: [{rotate: this.state.rotate}]},
          )}
        />
        <Text style={styles.text}>Source Map</Text>
      </YellowBoxPressable>
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
  pending: {
    backgroundColor: YellowBoxStyle.getTextColor(0.6),
  },
  image: {
    marginEnd: 4,
    tintColor: YellowBoxStyle.getBackgroundColor(1),
  },
  text: {
    color: YellowBoxStyle.getBackgroundColor(1),
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
});

module.exports = YellowBoxInspectorSourceMapStatus;
