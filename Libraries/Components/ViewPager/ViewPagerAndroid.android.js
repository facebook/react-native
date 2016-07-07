/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ViewPagerAndroid
 * @flow
 */
'use strict';

var React = require('React');
var ReactNative = require('react/lib/ReactNative');
var ReactElement = require('react/lib/ReactElement');
var ReactPropTypes = require('react/lib/ReactPropTypes');
var UIManager = require('UIManager');
var View = require('View');

var dismissKeyboard = require('dismissKeyboard');
var requireNativeComponent = require('requireNativeComponent');

var VIEWPAGER_REF = 'viewPager';

type Event = Object;

export type ViewPagerScrollState = $Enum<{
  idle: string;
  dragging: string;
  settling: string;
}>;

/**
 * Container that allows to flip left and right between child views. Each
 * child view of the `ViewPagerAndroid` will be treated as a separate page
 * and will be stretched to fill the `ViewPagerAndroid`.
 *
 * It is important all children are `<View>`s and not composite components.
 * You can set style properties like `padding` or `backgroundColor` for each
 * child.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   return (
 *     <ViewPagerAndroid
 *       style={styles.viewPager}
 *       initialPage={0}>
 *       <View style={styles.pageStyle}>
 *         <Text>First page</Text>
 *       </View>
 *       <View style={styles.pageStyle}>
 *         <Text>Second page</Text>
 *       </View>
 *     </ViewPagerAndroid>
 *   );
 * }
 *
 * ...
 *
 * var styles = {
 *   ...
 *   pageStyle: {
 *     alignItems: 'center',
 *     padding: 20,
 *   }
 * }
 * ```
 */
var ViewPagerAndroid = React.createClass({

  propTypes: {
    ...View.propTypes,
    /**
     * Index of initial page that should be selected. Use `setPage` method to
     * update the page, and `onPageSelected` to monitor page changes
     */
    initialPage: ReactPropTypes.number,

    /**
     * Executed when transitioning between pages (ether because of animation for
     * the requested page change or when user is swiping/dragging between pages)
     * The `event.nativeEvent` object for this callback will carry following data:
     *  - position - index of first page from the left that is currently visible
     *  - offset - value from range [0,1) describing stage between page transitions.
     *    Value x means that (1 - x) fraction of the page at "position" index is
     *    visible, and x fraction of the next page is visible.
     */
    onPageScroll: ReactPropTypes.func,

    /**
     * Function called when the page scrolling state has changed.
     * The page scrolling state can be in 3 states:
     * - idle, meaning there is no interaction with the page scroller happening at the time
     * - dragging, meaning there is currently an interaction with the page scroller
     * - settling, meaning that there was an interaction with the page scroller, and the
     *   page scroller is now finishing it's closing or opening animation
     */
    onPageScrollStateChanged: ReactPropTypes.func,

    /**
     * This callback will be called once ViewPager finish navigating to selected page
     * (when user swipes between pages). The `event.nativeEvent` object passed to this
     * callback will have following fields:
     *  - position - index of page that has been selected
     */
    onPageSelected: ReactPropTypes.func,

    /**
     * Blank space to show between pages. This is only visible while scrolling, pages are still
     * edge-to-edge.
     */
    pageMargin: ReactPropTypes.number,

    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'on-drag', the keyboard is dismissed when a drag begins.
     */
    keyboardDismissMode: ReactPropTypes.oneOf([
      'none', // default
      'on-drag',
    ]),

    /**
    * When false, the content does not scroll.
    * The default value is true.
    */
    scrollEnabled: ReactPropTypes.bool,
  },

  componentDidMount: function() {
    if (this.props.initialPage) {
      this.setPageWithoutAnimation(this.props.initialPage);
    }
  },

  getInnerViewNode: function(): ReactComponent {
    return this.refs[VIEWPAGER_REF].getInnerViewNode();
  },

  _childrenWithOverridenStyle: function(): Array {
    // Override styles so that each page will fill the parent. Native component
    // will handle positioning of elements, so it's not important to offset
    // them correctly.
    return React.Children.map(this.props.children, function(child) {
      if (!child) {
        return null;
      }
      var newProps = {
        ...child.props,
        style: [child.props.style, {
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: undefined,
          height: undefined,
        }],
        collapsable: false,
      };
      if (child.type &&
          child.type.displayName &&
          (child.type.displayName !== 'RCTView') &&
          (child.type.displayName !== 'View')) {
        console.warn('Each ViewPager child must be a <View>. Was ' + child.type.displayName);
      }
      return ReactElement.createElement(child.type, newProps);
    });
  },

  _onPageScroll: function(e: Event) {
    if (this.props.onPageScroll) {
      this.props.onPageScroll(e);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  },

  _onPageScrollStateChanged: function(e: Event) {
    if (this.props.onPageScrollStateChanged) {
      this.props.onPageScrollStateChanged(e.nativeEvent.pageScrollState);
    }
  },

  _onPageSelected: function(e: Event) {
    if (this.props.onPageSelected) {
      this.props.onPageSelected(e);
    }
  },

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will be animated.
   */
  setPage: function(selectedPage: number) {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.AndroidViewPager.Commands.setPage,
      [selectedPage],
    );
  },

  /**
   * A helper function to scroll to a specific page in the ViewPager.
   * The transition between pages will *not* be animated.
   */
  setPageWithoutAnimation: function(selectedPage: number) {
    UIManager.dispatchViewManagerCommand(
      ReactNative.findNodeHandle(this),
      UIManager.AndroidViewPager.Commands.setPageWithoutAnimation,
      [selectedPage],
    );
  },

  render: function() {
    return (
      <NativeAndroidViewPager
        {...this.props}
        ref={VIEWPAGER_REF}
        style={this.props.style}
        onPageScroll={this._onPageScroll}
        onPageScrollStateChanged={this._onPageScrollStateChanged}
        onPageSelected={this._onPageSelected}
        children={this._childrenWithOverridenStyle()}
      />
    );
  },
});

var NativeAndroidViewPager = requireNativeComponent('AndroidViewPager', ViewPagerAndroid);

module.exports = ViewPagerAndroid;
