/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ScrollViewStickyHeader
 * @flow
 * @format
 */
'use strict';

const Animated = require('Animated');
const React = require('React');
const StyleSheet = require('StyleSheet');

import type {LayoutEvent} from 'CoreEventTypes';

type Props = {
  children?: React.Element<any>,
  nextHeaderLayoutY: ?number,
  onLayout: (event: LayoutEvent) => void,
  scrollAnimatedValue: Animated.Value,
  // Will cause sticky headers to stick at the bottom of the ScrollView instead
  // of the top.
  inverted: ?boolean,
  // The height of the parent ScrollView. Currently only set when inverted.
  scrollViewHeight: ?number,
};

type State = {
  measured: boolean,
  layoutY: number,
  layoutHeight: number,
  nextHeaderLayoutY: ?number,
};

class ScrollViewStickyHeader extends React.Component<Props, State> {
  state = {
    measured: false,
    layoutY: 0,
    layoutHeight: 0,
    nextHeaderLayoutY: this.props.nextHeaderLayoutY,
  };

  setNextHeaderY(y: number) {
    this.setState({nextHeaderLayoutY: y});
  }

  _onLayout = event => {
    this.setState({
      measured: true,
      layoutY: event.nativeEvent.layout.y,
      layoutHeight: event.nativeEvent.layout.height,
    });

    this.props.onLayout(event);
    const child = React.Children.only(this.props.children);
    if (child.props.onLayout) {
      child.props.onLayout(event);
    }
  };

  render() {
    const {inverted, scrollViewHeight} = this.props;
    const {measured, layoutHeight, layoutY, nextHeaderLayoutY} = this.state;
    const inputRange: Array<number> = [-1, 0];
    const outputRange: Array<number> = [0, 0];

    if (measured) {
      if (inverted) {
        // The interpolation looks like:
        // - Negative scroll: no translation
        // - `stickStartPoint` is the point at which the header will start sticking.
        //   It is calculated using the ScrollView viewport height so it is a the bottom.
        // - Headers that are in the initial viewport will never stick, `stickStartPoint`
        //   will be negative.
        // - From 0 to `stickStartPoint` no translation. This will cause the header
        //   to scroll normally until it reaches the top of the scroll view.
        // - From `stickStartPoint` to when the next header y hits the bottom edge of the header: translate
        //   equally to scroll. This will cause the header to stay at the top of the scroll view.
        // - Past the collision with the next header y: no more translation. This will cause the
        //   header to continue scrolling up and make room for the next sticky header.
        //   In the case that there is no next header just translate equally to
        //   scroll indefinitely.
        if (scrollViewHeight !== null) {
          const stickStartPoint = layoutY + layoutHeight - scrollViewHeight;
          if (stickStartPoint > 0) {
            inputRange.push(stickStartPoint);
            outputRange.push(0);
            inputRange.push(stickStartPoint + 1);
            outputRange.push(1);
            // If the next sticky header has not loaded yet (probably windowing) or is the last
            // we can just keep it sticked forever.
            const collisionPoint =
              (nextHeaderLayoutY || 0) - layoutHeight - scrollViewHeight;
            if (collisionPoint > stickStartPoint) {
              inputRange.push(collisionPoint, collisionPoint + 1);
              outputRange.push(
                collisionPoint - stickStartPoint,
                collisionPoint - stickStartPoint,
              );
            }
          }
        }
      } else {
        // The interpolation looks like:
        // - Negative scroll: no translation
        // - From 0 to the y of the header: no translation. This will cause the header
        //   to scroll normally until it reaches the top of the scroll view.
        // - From header y to when the next header y hits the bottom edge of the header: translate
        //   equally to scroll. This will cause the header to stay at the top of the scroll view.
        // - Past the collision with the next header y: no more translation. This will cause the
        //   header to continue scrolling up and make room for the next sticky header.
        //   In the case that there is no next header just translate equally to
        //   scroll indefinitely.
        inputRange.push(layoutY);
        outputRange.push(0);
        // If the next sticky header has not loaded yet (probably windowing) or is the last
        // we can just keep it sticked forever.
        const collisionPoint = (nextHeaderLayoutY || 0) - layoutHeight;
        if (collisionPoint >= layoutY) {
          inputRange.push(collisionPoint, collisionPoint + 1);
          outputRange.push(collisionPoint - layoutY, collisionPoint - layoutY);
        } else {
          inputRange.push(layoutY + 1);
          outputRange.push(1);
        }
      }
    }

    const translateY = this.props.scrollAnimatedValue.interpolate({
      inputRange,
      outputRange,
    });
    const child = React.Children.only(this.props.children);

    return (
      <Animated.View
        collapsable={false}
        onLayout={this._onLayout}
        style={[child.props.style, styles.header, {transform: [{translateY}]}]}>
        {React.cloneElement(child, {
          style: styles.fill, // We transfer the child style to the wrapper.
          onLayout: undefined, // we call this manually through our this._onLayout
        })}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
  },
  fill: {
    flex: 1,
  },
});

module.exports = ScrollViewStickyHeader;
