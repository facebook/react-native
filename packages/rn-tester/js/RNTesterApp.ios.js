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

import {AppRegistry} from 'react-native';
import React from 'react';

import SnapshotViewIOS from './examples/Snapshot/SnapshotViewIOS.ios';
import RNTesterExampleContainer from './components/RNTesterExampleContainer';
import RNTesterList from './utils/RNTesterList';
import RNTesterApp from './RNTesterAppShared';
import type {RNTesterExample} from './types/RNTesterTypes';

AppRegistry.registerComponent('SetPropertiesExampleApp', () =>
  require('./examples/SetPropertiesExample/SetPropertiesExampleApp'),
);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () =>
  require('./examples/RootViewSizeFlexibilityExample/RootViewSizeFlexibilityExampleApp'),
);
AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

// Register suitable examples for snapshot tests
RNTesterList.ComponentExamples.concat(RNTesterList.APIExamples).forEach(
  (Example: RNTesterExample) => {
    const ExampleModule = Example.module;
    if (ExampleModule.displayName) {
      class Snapshotter extends React.Component<{...}> {
        render() {
          return (
            <SnapshotViewIOS>
              <RNTesterExampleContainer module={ExampleModule} />
            </SnapshotViewIOS>
          );
        }
      }

      AppRegistry.registerComponent(
        ExampleModule.displayName,
        () => Snapshotter,
      );
    }
  },
);

module.exports = RNTesterApp;
