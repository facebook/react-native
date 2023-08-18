/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {Node} from 'react';

import {AppRegistry} from 'react-native';
import React from 'react';

import SnapshotViewIOS from './examples/Snapshot/SnapshotViewIOS.ios';
import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterList from './utils/RNTesterList';
import RNTesterApp from './RNTesterAppShared';
import type {RNTesterModuleInfo} from './types/RNTesterTypes';

AppRegistry.registerComponent('SetPropertiesExampleApp', () =>
  require('./examples/SetPropertiesExample/SetPropertiesExampleApp'),
);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () =>
  require('./examples/RootViewSizeFlexibilityExample/RootViewSizeFlexibilityExampleApp'),
);
AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

// Register suitable examples for snapshot tests
RNTesterList.Components.concat(RNTesterList.APIs).forEach(
  (Example: RNTesterModuleInfo) => {
    const ExampleModule = Example.module;
    if (ExampleModule.displayName) {
      class Snapshotter extends React.Component<{...}> {
        render(): Node {
          return (
            <SnapshotViewIOS>
              <RNTesterModuleContainer
                module={ExampleModule}
                onExampleCardPress={() => {}}
              />
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
