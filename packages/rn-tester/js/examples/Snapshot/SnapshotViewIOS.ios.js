/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {ViewProps} from 'react-native/Libraries/Components/View/ViewPropTypes';
import type {SyntheticEvent} from 'react-native/Libraries/Types/CoreEventTypes';

const React = require('react');
const {NativeModules, StyleSheet, UIManager, View} = require('react-native');

const {TestModule} = NativeModules;

// Verify that RCTSnapshot is part of the UIManager since it is only loaded
// if you have linked against RCTTest like in tests, otherwise we will have
// a warning printed out
const RCTSnapshot = UIManager.hasViewManagerConfig('RCTSnapshot')
  ? require('../../../RCTTest/RCTSnapshotNativeComponent')
  : View;

type SnapshotReadyEvent = SyntheticEvent<
  $ReadOnly<{testIdentifier: string, ...}>,
>;

type Props = $ReadOnly<{
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => mixed,
  testIdentifier?: ?string,
}>;

class SnapshotViewIOS extends React.Component<Props> {
  onDefaultAction: (event: SnapshotReadyEvent) => void = (
    event: SnapshotReadyEvent,
  ) => {
    TestModule.verifySnapshot(TestModule.markTestPassed);
  };

  render(): React.Node {
    const testIdentifier = this.props.testIdentifier || 'test';
    const onSnapshotReady = this.props.onSnapshotReady || this.onDefaultAction;
    return (
      // $FlowFixMe[prop-missing] - Typing ReactNativeComponent revealed errors
      <RCTSnapshot
        style={style.snapshot}
        {...this.props}
        onSnapshotReady={onSnapshotReady}
        testIdentifier={testIdentifier}
      />
    );
  }
}

const style = StyleSheet.create({
  snapshot: {
    flex: 1,
  },
});

module.exports = SnapshotViewIOS;
