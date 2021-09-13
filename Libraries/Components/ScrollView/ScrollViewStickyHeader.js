/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import AnimatedImplementation from '../../Animated/AnimatedImplementation';
import AnimatedAddition from '../../Animated/nodes/AnimatedAddition';
import AnimatedDiffClamp from '../../Animated/nodes/AnimatedDiffClamp';
import AnimatedNode from '../../Animated/nodes/AnimatedNode';

import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../View/View';
import Platform from '../../Utilities/Platform';

import type {LayoutEvent} from '../../Types/CoreEventTypes';

const AnimatedView = AnimatedImplementation.createAnimatedComponent(View);

export type Props = $ReadOnly<{
  children?: React.Element<any>,
  nextHeaderLayoutY: ?number,
  onLayout: (event: LayoutEvent) => void,
  scrollAnimatedValue: AnimatedImplementation.Value,
  // Will cause sticky headers to stick at the bottom of the ScrollView instead
  // of the top.
  inverted: ?boolean,
  // The height of the parent ScrollView. Currently only set when inverted.
  scrollViewHeight: ?number,
  nativeID?: ?string,
  hiddenOnScroll?: ?boolean,
}>;

type State = {
  measured: boolean,
  layoutY: number,
  layoutHeight: number,
  nextHeaderLayoutY: ?number,
  translateY: ?number,
  ...
};

class ScrollViewStickyHeader extends React.Component<Props, State> {
  state: State = {
    measured: false,
    layoutY: 0,
    layoutHeight: 0,
    nextHeaderLayoutY: this.props.nextHeaderLayoutY,
    translateY: null,
  };

  _translateY: ?AnimatedNode = null;
  _shouldRecreateTranslateY: boolean = true;
  _haveReceivedInitialZeroTranslateY: boolean = true;
  _ref: any; // TODO T53738161: flow type this, and the whole file

  // Fabric-only:
  _timer: ?TimeoutID;
  _animatedValueListenerId: string;
  _animatedValueListener: (valueObject: $ReadOnly<{|value: number|}>) => void;
  _debounceTimeout: number = Platform.OS === 'android' ? 15 : 64;

  setNextHeaderY: (y: number) => void = (y: number): void => {
    this._shouldRecreateTranslateY = true;
    this.setState({nextHeaderLayoutY: y});
  };

  componentWillUnmount() {
    if (this._translateY != null && this._animatedValueListenerId != null) {
      this._translateY.removeListener(this._animatedValueListenerId);
    }
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (
      nextProps.scrollViewHeight !== this.props.scrollViewHeight ||
      nextProps.scrollAnimatedValue !== this.props.scrollAnimatedValue ||
      nextProps.inverted !== this.props.inverted
    ) {
      this._shouldRecreateTranslateY = true;
    }
  }

  updateTranslateListener(
    translateY: AnimatedImplementation.Interpolation,
    isFabric: boolean,
    offset: AnimatedDiffClamp | null,
  ) {
    if (this._translateY != null && this._animatedValueListenerId != null) {
      this._translateY.removeListener(this._animatedValueListenerId);
    }
    offset
      ? (this._translateY = new AnimatedAddition(translateY, offset))
      : (this._translateY = translateY);

    this._shouldRecreateTranslateY = false;

    if (!isFabric) {
      return;
    }

    if (!this._animatedValueListener) {
      // This is called whenever the (Interpolated) Animated Value
      // updates, which is several times per frame during scrolling.
      // To ensure that the Fabric ShadowTree has the most recent
      // translate style of this node, we debounce the value and then
      // pass it through to the underlying node during render.
      // This is:
      // 1. Only an issue in Fabric.
      // 2. Worse in Android than iOS. In Android, but not iOS, you
      //    can touch and move your finger slightly and still trigger
      //    a "tap" event. In iOS, moving will cancel the tap in
      //    both Fabric and non-Fabric. On Android when you move
      //    your finger, the hit-detection moves from the Android
      //    platform to JS, so we need the ShadowTree to have knowledge
      //    of the current position.
      this._animatedValueListener = ({value}) => {
        // When the AnimatedInterpolation is recreated, it always initializes
        // to a value of zero and emits a value change of 0 to its listeners.
        if (value === 0 && !this._haveReceivedInitialZeroTranslateY) {
          this._haveReceivedInitialZeroTranslateY = true;
          return;
        }
        if (this._timer) {
          clearTimeout(this._timer);
        }
        this._timer = setTimeout(() => {
          if (value !== this.state.translateY) {
            this.setState({
              translateY: value,
            });
          }
        }, this._debounceTimeout);
      };
    }
    if (this.state.translateY !== 0 && this.state.translateY != null) {
      this._haveReceivedInitialZeroTranslateY = false;
    }
    this._animatedValueListenerId = translateY.addListener(
      this._animatedValueListener,
    );
  }

  _onLayout = event => {
    const layoutY = event.nativeEvent.layout.y;
    const layoutHeight = event.nativeEvent.layout.height;
    const measured = true;

    if (
      layoutY !== this.state.layoutY ||
      layoutHeight !== this.state.layoutHeight ||
      measured !== this.state.measured
    ) {
      this._shouldRecreateTranslateY = true;
    }

    this.setState({
      measured,
      layoutY,
      layoutHeight,
    });

    this.props.onLayout(event);
    const child = React.Children.only(this.props.children);
    if (child.props.onLayout) {
      child.props.onLayout(event);
    }
  };

  _setComponentRef = ref => {
    this._ref = ref;
  };

  render(): React.Node {
    // Fabric Detection
    const isFabric = !!(
      // An internal transform mangles variables with leading "_" as private.
      // eslint-disable-next-line dot-notation
      (this._ref && this._ref['_internalInstanceHandle']?.stateNode?.canonical)
    );
    // Initially and in the case of updated props or layout, we
    // recreate this interpolated value. Otherwise, we do not recreate
    // when there are state changes.
    if (this._shouldRecreateTranslateY) {
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
          if (scrollViewHeight != null) {
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
            outputRange.push(
              collisionPoint - layoutY,
              collisionPoint - layoutY,
            );
          } else {
            inputRange.push(layoutY + 1);
            outputRange.push(1);
          }
        }
      }

      this.updateTranslateListener(
        this.props.scrollAnimatedValue.interpolate({
          inputRange,
          outputRange,
        }),
        isFabric,
        this.props.hiddenOnScroll
          ? new AnimatedDiffClamp(
              this.props.scrollAnimatedValue
                .interpolate({
                  extrapolateLeft: 'clamp',
                  inputRange: [layoutY, layoutY + 1],
                  outputRange: ([0, 1]: Array<number>),
                })
                .interpolate({
                  inputRange: [0, 1],
                  outputRange: ([0, -1]: Array<number>),
                }),
              -this.state.layoutHeight,
              0,
            )
          : null,
      );
    }

    const child = React.Children.only(this.props.children);

    // TODO T68319535: remove this if NativeAnimated is rewritten for Fabric
    const passthroughAnimatedPropExplicitValues =
      isFabric && this.state.translateY != null
        ? {
            style: {transform: [{translateY: this.state.translateY}]},
          }
        : null;

    return (
      <AnimatedView
        collapsable={false}
        nativeID={this.props.nativeID}
        onLayout={this._onLayout}
        ref={this._setComponentRef}
        style={[
          child.props.style,
          styles.header,
          {transform: [{translateY: this._translateY}]},
        ]}
        passthroughAnimatedPropExplicitValues={
          passthroughAnimatedPropExplicitValues
        }>
        {React.cloneElement(child, {
          style: styles.fill, // We transfer the child style to the wrapper.
          onLayout: undefined, // we call this manually through our this._onLayout
        })}
      </AnimatedView>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
    position: 'relative',
  },
  fill: {
    flex: 1,
  },
});

module.exports = ScrollViewStickyHeader;
