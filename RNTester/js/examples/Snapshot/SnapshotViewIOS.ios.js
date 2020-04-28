/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {NativeModules, StyleSheet, UIManager, View} = require('react-native');

const {TestModule} = NativeModules;

import type {SyntheticEvent} from '../../../../Libraries/Types/CoreEventTypes';
import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';

// Verify that RCTSnapshot is part of the UIManager since it is only loaded
// if you have linked against RCTTest like in tests, otherwise we will have
// a warning printed out
const RCTSnapshot = UIManager.getViewManagerConfig('RCTSnapshot')
  ? require('../../../RCTTest/RCTSnapshotNativeComponent')
  : View;

type SnapshotReadyEvent = SyntheticEvent<
  $ReadOnly<{
    testIdentifier: string,
  }>,
>;

type Props = $ReadOnly<{|
  ...ViewProps,
  onSnapshotReady?: ?(event: SnapshotReadyEvent) => mixed,
  testIdentifier?: ?string,
|}>;

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
      // $FlowFixMe - Typing ReactNativeComponent revealed errors
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
