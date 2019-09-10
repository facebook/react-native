/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow weak
 */

'use strict';

const React = require('react');
const {PanResponder, StyleSheet, View} = require('react-native');

import type {
  PanResponderInstance,
  GestureState,
} from '../../../../Libraries/Interaction/PanResponder';
import type {PressEvent} from '../../../../Libraries/Types/CoreEventTypes';

type CircleStyles = {
  backgroundColor?: string,
  left?: number,
  top?: number,
};

const CIRCLE_SIZE = 80;

type Props = $ReadOnly<{||}>;

class PanResponderExample extends React.Component<Props> {
  _handleStartShouldSetPanResponder = (
    event: PressEvent,
    gestureState: GestureState,
  ): boolean => {
    // Should we become active when the user presses down on the circle?
    return true;
  };

  _handleMoveShouldSetPanResponder = (
    event: PressEvent,
    gestureState: GestureState,
  ): boolean => {
    // Should we become active when the user moves a touch over the circle?
    return true;
  };

  _handlePanResponderGrant = (
    event: PressEvent,
    gestureState: GestureState,
  ) => {
    this._highlight();
  };

  _handlePanResponderMove = (event: PressEvent, gestureState: GestureState) => {
    this._circleStyles.style.left = this._previousLeft + gestureState.dx;
    this._circleStyles.style.top = this._previousTop + gestureState.dy;
    this._updateNativeStyles();
  };

  _handlePanResponderEnd = (event: PressEvent, gestureState: GestureState) => {
    this._unHighlight();
    this._previousLeft += gestureState.dx;
    this._previousTop += gestureState.dy;
  };

  _panResponder: PanResponderInstance = PanResponder.create({
    onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
    onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
    onPanResponderGrant: this._handlePanResponderGrant,
    onPanResponderMove: this._handlePanResponderMove,
    onPanResponderRelease: this._handlePanResponderEnd,
    onPanResponderTerminate: this._handlePanResponderEnd,
  });

  _previousLeft: number = 0;
  _previousTop: number = 0;
  _circleStyles: {|style: CircleStyles|} = {style: {}};
  circle: ?React.ElementRef<typeof View> = null;

  UNSAFE_componentWillMount() {
    this._previousLeft = 20;
    this._previousTop = 84;
    this._circleStyles = {
      style: {
        left: this._previousLeft,
        top: this._previousTop,
        backgroundColor: 'green',
      },
    };
  }

  componentDidMount() {
    this._updateNativeStyles();
  }

  _highlight() {
    this._circleStyles.style.backgroundColor = 'blue';
    this._updateNativeStyles();
  }

  _unHighlight() {
    this._circleStyles.style.backgroundColor = 'green';
    this._updateNativeStyles();
  }

  _updateNativeStyles() {
    this.circle && this.circle.setNativeProps(this._circleStyles);
  }

  render(): React.Node {
    return (
      <View style={styles.container}>
        <View
          ref={circle => {
            this.circle = circle;
          }}
          style={styles.circle}
          {...this._panResponder.panHandlers}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    backgroundColor: 'green',
    borderRadius: CIRCLE_SIZE / 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  container: {
    flex: 1,
    height: 500,
  },
});

exports.title = 'PanResponder Sample';
exports.description =
  'Shows the Use of PanResponder to provide basic gesture handling';
exports.examples = [
  {
    title: 'Basic gesture handling',
    render: function(): React.Element<typeof PanResponderExample> {
      return <PanResponderExample />;
    },
  },
];
