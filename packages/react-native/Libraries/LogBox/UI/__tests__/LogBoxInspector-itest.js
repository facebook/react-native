/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import LogBoxLog from 'react-native/Libraries/LogBox/Data/LogBoxLog';
import LogBoxInspector from 'react-native/Libraries/LogBox/UI/LogBoxInspector';
import * as React from 'react';

describe('LogBoxInspector', () => {
  it('should render nothing with no logs', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <LogBoxInspector
          onDismiss={() => {}}
          onMinimize={() => {}}
          onChangeSelectedIndex={() => {}}
          logs={[]}
          selectedIndex={0}
        />,
      );
    });

    // LogBoxInspector returns null when logs is empty, so nothing is rendered.
    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(null);
  });

  it('should render inspector with a warn log', () => {
    const root = Fantom.createRoot();

    const logs = [
      new LogBoxLog({
        level: 'warn',
        isComponentError: false,
        message: {
          content: 'Some kind of message (first)',
          substitutions: [],
        },
        stack: [],
        category: 'Some kind of message (first)',
        componentStack: [],
      }),
    ];

    Fantom.runTask(() => {
      root.render(
        <LogBoxInspector
          onDismiss={() => {}}
          onMinimize={() => {}}
          onChangeSelectedIndex={() => {}}
          logs={logs}
          selectedIndex={0}
        />,
      );
    });

    // When there is a log, the inspector renders a root view with id logbox_inspector.
    // Verify the top-level view is present by checking the JSON type.
    const output = root.getRenderedOutput({props: []}).toJSONObject();
    expect(output.type).toEqual('View');
  });
});
