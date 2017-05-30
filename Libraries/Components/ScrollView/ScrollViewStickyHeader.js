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
 */
'use strict';

const Animated = require('Animated');
const React = require('React');
const StyleSheet = require('StyleSheet');

type Props = {
  children?: React.Element<*>,
  nextHeaderLayoutY: ?number,
  onLayout: (event: Object) => void,
  scrollAnimatedValue: Animated.Value,
};

class ScrollViewStickyHeader extends React.Component {
  props: Props;
  state: {
    measured: boolean,
    layoutY: number,
    layoutHeight: number,
    nextHeaderLayoutY: ?number,
  };

  constructor(props: Props, context: Object) {
    super(props, context);
    this.state = {
      measured: false,
      layoutY: 0,
      layoutHeight: 0,
      nextHeaderLayoutY: props.nextHeaderLayoutY,
    };
  }

  setNextHeaderY(y: number) {
    this.setState({ nextHeaderLayoutY: y });
  }

  _onLayout = (event) => {
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
    const {measured, layoutHeight, layoutY, nextHeaderLayoutY} = this.state;
    const inputRange: Array<number> = [-1, 0];
    const outputRange: Array<number> = [0, 0];

    if (measured) {
      // The interpolation looks like:
      // - Negative scroll: no translation
      // - From 0 to the y of the header: no translation. This will cause the header
      //   to scroll normally until it reaches the top of the scroll view.
      // - From header y to when the next header y hits the bottom edge of the header: translate
      //   equally to scroll. This will cause the header to stay at the top of the scroll view.
      // - Past the collision with the next header y: no more translation. This will cause the
      // header to continue scrolling up and make room for the next sticky header.
      // In the case that there is no next header just translate equally to
      // scroll indefinetly.
      inputRange.push(layoutY);
      outputRange.push(0);
      // Sometimes headers jump around so we make sure we don't violate the monotonic inputRange
      // condition.
      const collisionPoint = (nextHeaderLayoutY || 0) - layoutHeight;
      if (collisionPoint >= layoutY) {
        inputRange.push(collisionPoint, collisionPoint + 1);
        outputRange.push(collisionPoint - layoutY, collisionPoint - layoutY);
      } else {
        inputRange.push(layoutY + 1);
        outputRange.push(1);
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
