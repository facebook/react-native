/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

var PropTypes = require('prop-types');
var React = require('react');
var ReactNative = require('react-native');
var {ScrollView, StyleSheet, View} = ReactNative;

var RNTesterTitle = require('./RNTesterTitle');

class RNTesterPage extends React.Component<{
  noScroll?: boolean,
  noSpacer?: boolean,
}> {
  static propTypes = {
    noScroll: PropTypes.bool,
    noSpacer: PropTypes.bool,
  };

  render() {
    var ContentWrapper;
    var wrapperProps = {};
    if (this.props.noScroll) {
      ContentWrapper = ((View: any): React.ComponentType<any>);
    } else {
      ContentWrapper = (ScrollView: React.ComponentType<any>);
      // $FlowFixMe found when converting React.createClass to ES6
      wrapperProps.automaticallyAdjustContentInsets = !this.props.title;
      wrapperProps.keyboardShouldPersistTaps = 'handled';
      wrapperProps.keyboardDismissMode = 'interactive';
    }
    /* $FlowFixMe(>=0.68.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.68 was deployed. To see the error delete this
     * comment and run Flow. */
    var title = this.props.title ? (
      <RNTesterTitle title={this.props.title} />
    ) : null;
    var spacer = this.props.noSpacer ? null : <View style={styles.spacer} />;
    return (
      <View style={styles.container}>
        {title}
        <ContentWrapper style={styles.wrapper} {...wrapperProps}>
          {
            // $FlowFixMe found when converting React.createClass to ES6
            this.props.children
          }
          {spacer}
        </ContentWrapper>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: '#e9eaed',
    flex: 1,
  },
  spacer: {
    height: 270,
  },
  wrapper: {
    flex: 1,
    paddingTop: 10,
  },
});

module.exports = RNTesterPage;
