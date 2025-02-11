/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import ensureInstance from '../../../src/private/utilities/ensureInstance';
import ReadOnlyElement from '../../../src/private/webapis/dom/nodes/ReadOnlyElement';
import View from '../../Components/View/View';
import AppContainer from '../../ReactNative/AppContainer';
import LogBoxInspectorContainer from '../LogBoxInspectorContainer';
import {
  ManualConsoleError,
  // $FlowExpectedError[untyped-import]
} from './__fixtures__/ReactWarningFixtures';
import Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';

import '../../Core/InitializeCore.js';

function findById(node: ReadOnlyElement, id: string): ?ReadOnlyElement {
  if (node.id === id) {
    return node;
  }

  for (const child of node.children) {
    const found = findById(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

describe('LogBox', () => {
  let originalConsoleError;
  let originalConsoleWarn;
  let mockError;
  let mockWarn;

  beforeAll(() => {
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
  });

  beforeEach(() => {
    mockError = jest.fn((...args) => {
      originalConsoleError(...args);
    });
    mockWarn = jest.fn((...args) => {
      originalConsoleWarn(...args);
    });
    // $FlowExpectedError[cannot-write]
    console.error = mockError;
    // $FlowExpectedError[cannot-write]
    console.warn = mockWarn;
  });

  afterEach(() => {
    // $FlowExpectedError[cannot-write]
    console.error = originalConsoleError;
    // $FlowExpectedError[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('renders an empty screen if there are no errors', () => {
    const logBoxRoot = Fantom.createRoot();
    Fantom.runTask(() => {
      logBoxRoot.render(<LogBoxInspectorContainer />);
    });

    expect(logBoxRoot.getRenderedOutput().toJSX()).toBe(null);
  });

  it('handles a manual console.error without a component stack in LogBox', () => {
    let maybeViewNode;

    const logBoxRoot = Fantom.createRoot();
    Fantom.runTask(() => {
      logBoxRoot.render(
        <View
          ref={node => {
            maybeViewNode = node;
          }}>
          <LogBoxInspectorContainer />
        </View>,
      );
    });

    expect(logBoxRoot.getRenderedOutput().toJSX()).toBe(null);

    const logBoxRootNode = ensureInstance(maybeViewNode, ReadOnlyElement);

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={node => {
            maybeViewNode = node;
          }}>
          <AppContainer rootTag={root.getRootTag()}>
            <ManualConsoleError />
          </AppContainer>
        </View>,
      );
    });

    expect(logBoxRoot.getRenderedOutput().toJSX()).toBe(null);

    const appRootNode = ensureInstance(maybeViewNode, ReadOnlyElement);
    const logBoxButton = nullthrows(
      findById(appRootNode, 'logbox_button_error'),
    );

    Fantom.dispatchNativeEvent(logBoxButton, 'click');

    const headerTitle = findById(logBoxRootNode, 'logbox_header_title_text');
    const messageTitle = findById(logBoxRootNode, 'logbox_message_title_text');
    const messageContents = findById(
      logBoxRootNode,
      'logbox_message_contents_text',
    );

    expect(headerTitle?.textContent).toBe('Log 1 of 1');
    expect(messageTitle?.textContent).toBe('Console Error');
    expect(messageContents?.textContent).toBe('Manual console error');
  });
});
