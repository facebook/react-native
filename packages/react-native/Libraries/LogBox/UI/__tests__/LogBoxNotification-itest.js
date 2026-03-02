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
import LogBoxNotification from 'react-native/Libraries/LogBox/UI/LogBoxNotification';
import * as React from 'react';

const log = new LogBoxLog({
  level: 'warn',
  isComponentError: false,
  message: {
    content: 'Some kind of message',
    substitutions: [],
  },
  stack: [],
  category: 'Some kind of message',
  componentStack: [],
});

describe('LogBoxNotification', () => {
  it('should render log notification with warn level', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <LogBoxNotification
          log={log}
          totalLogCount={1}
          level="warn"
          onPressOpen={() => {}}
          onPressDismiss={() => {}}
        />,
      );
    });

    // Use toJSON to get the raw structure for reliable deep comparison.
    // The notification renders a container View > pressable View > flattened children.
    const output = root.getRenderedOutput({props: []}).toJSON();
    expect(output).toEqual({
      type: 'View',
      props: {},
      children: [
        {
          type: 'View',
          props: {},
          children: [
            {type: 'View', props: {}, children: []},
            {type: 'View', props: {}, children: []},
            {type: 'Paragraph', props: {}, children: ['!']},
            {type: 'View', props: {}, children: []},
            {
              type: 'Paragraph',
              props: {},
              children: [
                {type: 'Text', props: {}, children: 'Some kind of message'},
              ],
            },
            {
              type: 'View',
              props: {},
              children: [{type: 'Image', props: {}, children: []}],
            },
          ],
        },
      ],
    });
  });
});
