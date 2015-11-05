/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ViewPagerAndroid
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ReactElement = require('ReactElement');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var ReactPropTypes = require('ReactPropTypes');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var dismissKeyboard = require('dismissKeyboard');

var VIEWPAGER_REF = 'viewPager';

var ViewPagerValidAttributes = {
  selectedPage: true,
};

/**
 * Container that allows to flip left and right between child views. Each
 * child view of the `ViewPagerAndroid` will be treated as a separate page
 * and will be streched to fill the `ViewPagerAndroid`.
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
     * This callback will be caleld once ViewPager finish navigating to selected page
     * (when user swipes between pages). The `event.nativeEvent` object passed to this
     * callback will have following fields:
     *  - position - index of page that has been selected
     */
    onPageSelected: ReactPropTypes.func,

    /**
     * Determines whether the keyboard gets dismissed in response to a drag.
     *   - 'none' (the default), drags do not dismiss the keyboard.
     *   - 'on-drag', the keyboard is dismissed when a drag begins.
     */
    keyboardDismissMode: ReactPropTypes.oneOf([
      'none', // default
      'on-drag',
    ]),
  },

  getInitialState: function() {
    return {
      selectedPage: this.props.initialPage,
    };
  },

  getInnerViewNode: function() {
    return this.refs[VIEWPAGER_REF].getInnerViewNode();
  },

  _childrenWithOverridenStyle: function() {
    // Override styles so that each page will fill the parent. Native component
    // will handle positioning of elements, so it's not important to offset
    // them correctly.
    return React.Children.map(this.props.children, function(child) {
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
  _onPageScroll: function(event) {
    if (this.props.onPageScroll) {
      this.props.onPageScroll(event);
    }
    if (this.props.keyboardDismissMode === 'on-drag') {
      dismissKeyboard();
    }
  },
  _onPageSelected: function(event) {
    var selectedPage = event.nativeEvent.position;
    this.setState({
      selectedPage,
    });
    if (this.props.onPageSelected) {
      this.props.onPageSelected(event);
    }
  },
  setPage: function(selectedPage) {
    this.setState({
      selectedPage,
    });
  },
  render: function() {
    return (
      <NativeAndroidViewPager
        ref={VIEWPAGER_REF}
        style={this.props.style}
        selectedPage={this.state.selectedPage}
        onPageScroll={this._onPageScroll}
        onPageSelected={this._onPageSelected}
        children={this._childrenWithOverridenStyle()}
      />
    );
  },
});

var NativeAndroidViewPager = createReactNativeComponentClass({
  validAttributes: {
    ...ReactNativeViewAttributes.UIView,
    ...ViewPagerValidAttributes,
  },
  uiViewClassName: 'AndroidViewPager',
});

module.exports = ViewPagerAndroid;
