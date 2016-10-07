/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SnapshotViewIOS
 * @flow
 */
'use strict';

var React = require('React');
var StyleSheet = require('StyleSheet');
var { TestModule } = require('NativeModules');
var UIManager = require('UIManager');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

class SnapshotViewIOS extends React.Component {
  props: {
    onSnapshotReady?: Function,
    testIdentifier?: string,
    snapshotDelay?: number
  };

  static propTypes = {
    ...View.propTypes,
    // A callback when the Snapshot view is ready to be compared
    onSnapshotReady : React.PropTypes.func,
    // A name to identify the individual instance to the SnapshotView
    testIdentifier : React.PropTypes.string,
    snapshotDelay : React.PropTypes.number
  };

  onDefaultAction = (event: Object) => {
    TestModule.verifySnapshot(TestModule.markTestPassed);
  };

  createDelay = () => {
    var onSnapshotReady = this.props.onSnapshotReady || this.onDefaultAction;
    if (!this.props.snapshotDelay || this.props.snapshotDelay === 0){
      onSnapshotReady();
      return;
    }
    setTimeout(onSnapshotReady, this.props.snapshotDelay * 1000);
  }

  render() {
    var testIdentifier = this.props.testIdentifier || 'test';
    return (
      <RCTSnapshot
        style={style.snapshot}
        {...this.props}
        onSnapshotReady={this.createDelay}
        testIdentifier={testIdentifier}
      />
    );
  }
}

var style = StyleSheet.create({
  snapshot: {
    flex: 1,
  },
});

// Verify that RCTSnapshot is part of the UIManager since it is only loaded
// if you have linked against RCTTest like in tests, otherwise we will have
// a warning printed out
var RCTSnapshot = UIManager.RCTSnapshot ?
  requireNativeComponent('RCTSnapshot', SnapshotViewIOS) :
  View;

module.exports = SnapshotViewIOS;
