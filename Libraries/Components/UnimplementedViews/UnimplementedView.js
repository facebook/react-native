/**
 * Common implementation for a simple stubbed view. Simply applies the view's styles to the inner
 * View component and renders its children.
 *
 * @providesModule UnimplementedView
 */

'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var UnimplementedView = React.createClass({
  setNativeProps: function() {
    // Do nothing.
    // This method is required in order to use this view as a Touchable* child.
    // See ensureComponentIsNative.js for more info
  },
  render: function() {
    return (
      <View style={[styles.unimplementedView, this.props.style]}>
        {this.props.children}
      </View>
    );
  },
});

var styles = StyleSheet.create({
  unimplementedView: {
    borderWidth: 1,
    borderColor: 'red',
    alignSelf: 'flex-start',
  }
});

module.exports = UnimplementedView;
