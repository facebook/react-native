/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SnapshotView
 * @flow
 */
'use strict';

var Platform = require('Platform');
var React = require('React');
var StyleSheet = require('StyleSheet');
var { TestModule } = require('NativeModules');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var SnapshotView = React.createClass({
  onDefaultAction: function(event: Object) {
    TestModule.verifySnapshot(TestModule.markTestPassed);
  },

  render: function() {
    var testIdentifier = this.props.testIdentifier || 'test';
    var onSnapshotReady = this.props.onSnapshotReady || this.onDefaultAction;
    return (
      <RCTSnapshot
        style={style.snapshot}
        {...this.props}
        onSnapshotReady={onSnapshotReady}
        testIdentifier={testIdentifier}
      />
    );
  },

  propTypes: {
    // A callback when the Snapshot view is ready to be compared
    onSnapshotReady : React.PropTypes.func,
    // A name to identify the individual instance to the SnapshotView
    testIdentifier : React.PropTypes.string,
  }
});

var style = StyleSheet.create({
  snapshot: {
    flex: 1,
  },
});

var RCTSnapshot = Platform.OS === 'ios' ?
  requireNativeComponent('RCTSnapshot', SnapshotView) :
  View;

module.exports = SnapshotView;
