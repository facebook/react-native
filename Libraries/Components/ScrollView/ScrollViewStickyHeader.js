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
  scrollAnimatedValue: Animated.Value,
  onLayout: (event: Object) => void,
};

class ScrollViewStickyHeader extends React.Component {
  props: Props;
  state = {
    measured: false,
    layoutY: 0,
    nextHeaderLayoutY: (null: ?number),
  };

  setNextHeaderY(y: number) {
    this.setState({ nextHeaderLayoutY: y });
  }

  _onLayout = (event) => {
    this.setState({
      measured: true,
      layoutY: event.nativeEvent.layout.y,
    });

    this.props.onLayout(event);
  };

  render() {
    const {measured, layoutY, nextHeaderLayoutY} = this.state;

    let translateY;
    if (measured) {
      // The interpolation looks like:
      // - Negative scroll: no translation
      // - From 0 to the y of the header: no translation. This will cause the header
      //   to scroll normally until it reaches the top of the scroll view.
      // - From the header y to the next header y: translate equally to scroll.
      //   This will cause the header to stay at the top of the scroll view.
      // - Past the the next header y: no more translation. This will cause the header
      //   to continue scrolling up and make room for the next sticky header.
      // In the case that there is no next header just translate equally to
      // scroll indefinetly.
      const inputRange = [-1, 0, layoutY];
      const outputRange: Array<number> = [0, 0, 0];
      if (nextHeaderLayoutY != null) {
        inputRange.push(nextHeaderLayoutY, nextHeaderLayoutY + 1);
        outputRange.push(nextHeaderLayoutY - layoutY, nextHeaderLayoutY - layoutY);
      } else {
        inputRange.push(layoutY + 1);
        outputRange.push(1);
      }
      translateY = this.props.scrollAnimatedValue.interpolate({
        inputRange,
        outputRange,
      });
    } else {
      translateY = 0;
    }

    const child = React.Children.only(this.props.children);

    return (
      <Animated.View
        collapsable={false}
        onLayout={this._onLayout}
        style={[child.props.style, styles.header, {transform: [{translateY}]}]}>
        {React.cloneElement(child, {
          style: styles.fill,
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
