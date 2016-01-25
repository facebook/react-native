/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule RecyclerViewBackedScrollView
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var ScrollResponder = require('ScrollResponder');
var ScrollView = require('ScrollView');
var View = require('View');
var StyleSheet = require('StyleSheet');

var requireNativeComponent = require('requireNativeComponent');

var INNERVIEW = 'InnerView';

/**
 * Wrapper around android native recycler view.
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

  render: function() {
    var props = {
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
      style: ([{flex: 1}, this.props.style]: ?Array<any>),
      ref: INNERVIEW,
    };

    if (this.props.onContentSizeChange) {
      props.onContentSizeChange = this._handleContentSizeChange;
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

    return (
      <NativeAndroidRecyclerView {...props}>
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
});

var NativeAndroidRecyclerView = requireNativeComponent(
  'AndroidRecyclerViewBackedScrollView',
  RecyclerViewBackedScrollView
);

module.exports = RecyclerViewBackedScrollView;
