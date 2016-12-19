/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule RecyclerViewBackedScrollView
 */
'use strict';

var React = require('React');
var ScrollResponder = require('ScrollResponder');
var ScrollView = require('ScrollView');
var View = require('View');
var StyleSheet = require('StyleSheet');

var requireNativeComponent = require('requireNativeComponent');

var INNERVIEW = 'InnerView';

/**
 * RecyclerViewBackedScrollView is DEPRECATED and will be removed from
 * React Native.
 * Please use a `ListView` which has `removeClippedSubviews` enabled by
 * default so that rows that are out of sight are automatically
 * detached from the view hierarchy.
 *
 * Wrapper around Android native recycler view.
 *
 * It simply renders rows passed as children in a separate recycler view cells
 * similarly to how `ScrollView` is doing it. Thanks to the fact that it uses
 * native `RecyclerView` though, rows that are out of sight are going to be
 * automatically detached (similarly on how this would work with
 * `removeClippedSubviews = true` on a `ScrollView.js`).
 *
 * CAUTION: This is an experimental component and should only be used together
 * with javascript implementation of list view (see ListView.js). In order to
 * use it pass this component as `renderScrollComponent` to the list view. For
 * now only horizontal scrolling is supported.
 *
 * Example:
 *
 * ```
 * getInitialState: function() {
 *   var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
 *   return {
 *     dataSource: ds.cloneWithRows(['row 1', 'row 2']),
 *   };
 * },
 *
 * render: function() {
 *   return (
 *     <ListView
 *       dataSource={this.state.dataSource}
 *       renderRow={rowData => <Text>{rowData}</Text>}
 *       renderScrollComponent={props => <RecyclerViewBackedScrollView {...props} />}
 *     />
 *   );
 * },
 * ```
 */
var RecyclerViewBackedScrollView = React.createClass({

  propTypes: {
    ...ScrollView.propTypes,
  },

  mixins: [ScrollResponder.Mixin],

  componentWillMount: function() {
    console.warn(
      'RecyclerViewBackedScrollView is DEPRECATED and will be removed from React Native. ' +
      'Please use a ListView which has removeClippedSubviews enabled by default so that ' +
      'rows that are out of sight are automatically detached from the view hierarchy.')
  },

  getInitialState: function() {
    return this.scrollResponderMixinGetInitialState();
  },

  getScrollResponder: function() {
    return this;
  },

  setNativeProps: function(props: Object) {
    this.refs[INNERVIEW].setNativeProps(props);
  },

  _handleContentSizeChange: function(event) {
    var {width, height} = event.nativeEvent;
    this.props.onContentSizeChange(width, height);
  },

  /**
   * A helper function to scroll to a specific point  in the scrollview.
   * This is currently used to help focus on child textviews, but can also
   * be used to quickly scroll to any element we want to focus. Syntax:
   *
   * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as as alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo: function(
    y?: number | { x?: number, y?: number, animated?: boolean },
    x?: number,
    animated?: boolean
  ) {
    if (typeof y === 'number') {
      console.warn('`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, animated: true})` instead.');
    } else {
      ({x, y, animated} = y || {});
    }
    this.getScrollResponder().scrollResponderScrollTo({x: x || 0, y: y || 0, animated: animated !== false});
  },

  render: function() {
    var recyclerProps = {
      ...this.props,
      onTouchStart: this.scrollResponderHandleTouchStart,
      onTouchMove: this.scrollResponderHandleTouchMove,
      onTouchEnd: this.scrollResponderHandleTouchEnd,
      onScrollBeginDrag: this.scrollResponderHandleScrollBeginDrag,
      onScrollEndDrag: this.scrollResponderHandleScrollEndDrag,
      onMomentumScrollBegin: this.scrollResponderHandleMomentumScrollBegin,
      onMomentumScrollEnd: this.scrollResponderHandleMomentumScrollEnd,
      onStartShouldSetResponder: this.scrollResponderHandleStartShouldSetResponder,
      onStartShouldSetResponderCapture: this.scrollResponderHandleStartShouldSetResponderCapture,
      onScrollShouldSetResponder: this.scrollResponderHandleScrollShouldSetResponder,
      onResponderGrant: this.scrollResponderHandleResponderGrant,
      onResponderRelease: this.scrollResponderHandleResponderRelease,
      onResponderReject: this.scrollResponderHandleResponderReject,
      onScroll: this.scrollResponderHandleScroll,
      ref: INNERVIEW,
    };

    if (this.props.onContentSizeChange) {
      recyclerProps.onContentSizeChange = this._handleContentSizeChange;
    }

    var wrappedChildren = React.Children.map(this.props.children, (child) => {
      if (!child) {
        return null;
      }
      return (
        <View
          collapsable={false}
          style={styles.absolute}>
          {child}
        </View>
      );
    });

    const refreshControl = this.props.refreshControl;
    if (refreshControl) {
      // Wrap the NativeAndroidRecyclerView with a AndroidSwipeRefreshLayout.
      return React.cloneElement(
        refreshControl,
        {style: [styles.base, this.props.style]},
        <NativeAndroidRecyclerView {...recyclerProps} style={styles.base}>
          {wrappedChildren}
        </NativeAndroidRecyclerView>
      );
    }

    return (
      <NativeAndroidRecyclerView {...recyclerProps} style={[styles.base, this.props.style]}>
        {wrappedChildren}
      </NativeAndroidRecyclerView>
    );
  },
});

var styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  base: {
    flex: 1,
  },
});

var NativeAndroidRecyclerView = requireNativeComponent(
  'AndroidRecyclerViewBackedScrollView',
  RecyclerViewBackedScrollView
);

module.exports = RecyclerViewBackedScrollView;
