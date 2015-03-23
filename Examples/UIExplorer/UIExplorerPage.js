/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIExplorerPage
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  ScrollView,
  StyleSheet,
  View,
} = React;

var UIExplorerTitle = require('./UIExplorerTitle');

var UIExplorerPage = React.createClass({

  propTypes: {
    keyboardShouldPersistTaps: React.PropTypes.bool,
    noScroll: React.PropTypes.bool,
    noSpacer: React.PropTypes.bool,
  },

  render: function() {
    var ContentWrapper;
    var wrapperProps = {};
    if (this.props.noScroll) {
      ContentWrapper = View;
    } else {
      ContentWrapper = ScrollView;
      wrapperProps.keyboardShouldPeristTaps = true;
      wrapperProps.keyboardDismissMode = 'interactive';
    }
    var title = this.props.title ?
      <UIExplorerTitle title={this.props.title} /> :
      null;
    var spacer = this.props.noSpacer ? null : <View style={styles.spacer} />;
    return (
      <View style={styles.container}>
        {title}
        <ContentWrapper
          style={styles.wrapper}
          {...wrapperProps}>
            {this.props.children}
            {spacer}
        </ContentWrapper>
      </View>
    );
  },
});

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9eaed',
    paddingTop: 15,
    flex: 1,
  },
  spacer: {
    height: 270,
  },
  wrapper: {
    flex: 1,
  },
});

module.exports = UIExplorerPage;
