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

import {AppRegistry, NativeModules, Platform, View} from 'react-native'; // [macOS] everything but AppRegistry
import React from 'react';

import SnapshotViewIOS from './examples/Snapshot/SnapshotViewIOS.ios';
import RNTesterModuleContainer from './components/RNTesterModuleContainer';
import RNTesterList from './utils/RNTesterList';
import RNTesterApp from './RNTesterAppShared';
import type {RNTesterModuleInfo} from './types/RNTesterTypes';

const {TestModule} = NativeModules; // [macOS]

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

    // [macOS
    class LoadPageTest extends React.Component<{}> {
      componentDidMount() {
        requestAnimationFrame(() => {
          TestModule.markTestCompleted();
        });
      }

      render(): Node {
        return <RNTesterModuleContainer module={ExampleModule} />;
      }
    }

    AppRegistry.registerComponent(
      'LoadPageTest_' + Example.key,
      () => LoadPageTest,
    );
    // macOS]
  },
);

// [macOS
class EnumerateExamplePages extends React.Component<{}> {
  render(): Node {
    RNTesterList.Components.concat(RNTesterList.APIs).forEach(
      (Example: RNTesterModuleInfo) => {
        let skipTest = false;
        if ('skipTest' in Example) {
          const platforms = Example.skipTest;
          skipTest =
            platforms !== undefined &&
            (Platform.OS in platforms || 'default' in platforms);
        }
        if (!skipTest) {
          console.trace(Example.key);
        }
      },
    );
    TestModule.markTestCompleted();
    return <View />;
  }
}

AppRegistry.registerComponent(
  'EnumerateExamplePages',
  () => EnumerateExamplePages,
);
// macOS]

module.exports = RNTesterApp;
