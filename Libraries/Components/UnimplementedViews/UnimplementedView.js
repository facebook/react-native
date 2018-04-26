/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');

/**
 * Common implementation for a simple stubbed view. Simply applies the view's styles to the inner
 * View component and renders its children.
 */
class UnimplementedView extends React.Component<$FlowFixMeProps> {
  setNativeProps() {
    // Do nothing.
    // This method is required in order to use this view as a Touchable* child.
    // See ensureComponentIsNative.js for more info
  }

  render() {
    // Workaround require cycle from requireNativeComponent
    const View = require('View');
    return (
      <View style={[styles.unimplementedView, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  unimplementedView: __DEV__
    ? {
        alignSelf: 'flex-start',
        borderColor: 'red',
        borderWidth: 1,
      }
    : {},
});

module.exports = UnimplementedView;
