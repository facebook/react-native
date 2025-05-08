/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import ReadOnlyElement from '../../../src/private/webapis/dom/nodes/ReadOnlyElement';
import View from '../../Components/View/View';
import AppContainer from '../../ReactNative/AppContainer';
import LogBoxInspectorContainer from '../LogBoxInspectorContainer';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';

import '../../Core/InitializeCore.js';

interface InspectorUI {
  header: ?string;
  title: ?string;
  message: ?string;
  // TODO: We get code frames from Metro,
  // which is not yet implemented in the fantom tests.
  // codeFrames: ?Array<string>,
  componentStackFrames: ?Array<string>;
  stackFrames: ?Array<string>;
  isDismissable: ?boolean;
}

interface NotificationUI {
  count: ?string;
  message: ?string;
}

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

function findTextById(node: ReadOnlyElement, id: string): ?string {
  if (node.id === id) {
    return node.textContent;
  }

  for (const child of node.children) {
    const found = findTextById(child, id);
    if (found != null) {
      return found;
    }
  }

  return null;
}

function findTextByIds(
  node: ReadOnlyElement,
  id: string,
  text: Array<string> = [],
): Array<string> {
  if (node.id === id && node.textContent != null) {
    text.push(node.textContent);
    return text;
  }

  for (const child of node.children) {
    findTextByIds(child, id, text);
  }

  return text;
}

// Finds the LogBox notification UI by searching for the text IDs.
function findLogBoxNotificationUI(node: ReadOnlyElement): NotificationUI {
  return {
    count: findTextById(node, 'logbox_notification_count_text'),
    message: findTextById(node, 'logbox_notification_message_text'),
  };
}

// Finds the LogBox inspector UI by searching for the text IDs.
function findLogBoxInspectorUI(node: ReadOnlyElement): InspectorUI {
  return {
    header: findTextById(node, 'logbox_header_title_text'),
    title: findTextById(node, 'logbox_message_title_text'),
    message: findTextById(node, 'logbox_message_contents_text'),
    // codeFrames: undefined,
    componentStackFrames: findTextByIds(
      node,
      'logbox_component_stack_frame_text',
    ),
    stackFrames: getStackFrames(node),
    isDismissable: findTextById(node, 'logbox_dismissable_text') == null,
  };
}

// Return the frames between the mock console and the bottom frame.
// These are the application frames not related to internals.
// For example:
//   _construct
//   Wrapper
//   _callSuper
//   reactConsoleErrorHandler
//   registerError
//   anonymous
//   anonymous
//   MockConsoleErrorForTesting  <-- mockConsoleIndex
//   ManualConsoleError
//   reactStackBottomFrame       <-- react bottom frame
//   <root>
//
// Becomes:
//   ManualConsoleError
//
// If there are no matches, we return all frames, to prevent false negatives.
function getStackFrames(node: ReadOnlyElement): ?Array<string> {
  const text = findTextByIds(node, 'logbox_stack_frame_text');
  const mockConsoleIndex = text.includes('MockConsoleErrorForTesting')
    ? text.indexOf('MockConsoleErrorForTesting') + 1
    : 0;
  const bottomFrameIndex = text.includes('reactStackBottomFrame')
    ? text.indexOf('reactStackBottomFrame')
    : text.length;
  return text.slice(mockConsoleIndex, bottomFrameIndex);
}

/**
 * renderLogBox is a helper function to render a component, and render LogBox.
 * It returns an object with methods to interact with the LogBox, and assert the UI.
 *
 */
export function renderLogBox(
  children: React.Node,
  options?: {crash: boolean},
): {
  // True if the LogBox inspector is open.
  isOpen: () => boolean,
  // Tap the notification to open the LogBox inspector.
  openNotification: () => void,
  // Tap to close the notification.
  dimissNotification: () => void,
  // Tap the minimize button to collapse the LogBox inspector.
  mimimizeInspector: () => void,
  // Tap the dismiss button to close the LogBox inspector.
  dismissInspector: () => void,
  // Tap the next button to go to the next log.
  nextLog: () => void,
  // Tap the previous button to go to the previous log.
  previousLog: () => void,
  // Returns the LogBox inspector UI as an object.
  getInspectorUI: () => ?InspectorUI,
  // Returns the LogBox notification UI as an object.
  getNotificationUI: () => ?NotificationUI,
} {
  let inspectorNode;

  const logBoxRoot = Fantom.createRoot();
  Fantom.runTask(() => {
    logBoxRoot.render(
      <View
        ref={node => {
          inspectorNode = node;
        }}>
        <LogBoxInspectorContainer />
      </View>,
    );
  });

  expect(logBoxRoot.getRenderedOutput().toJSX()).toBe(null);

  const logBoxInstance = ensureInstance(inspectorNode, ReadOnlyElement);

  let appNode;
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      <View
        ref={node => {
          appNode = node;
        }}>
        <AppContainer rootTag={root.getRootTag()}>{children}</AppContainer>
      </View>,
    );
  });

  return {
    isOpen: () => {
      return logBoxRoot.getRenderedOutput().toJSX() != null;
    },
    openNotification: () => {
      const appInstance = ensureInstance(appNode, ReadOnlyElement);
      const button = nullthrows(
        findById(appInstance, 'logbox_open_button_error'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    dimissNotification: () => {
      const appInstance = ensureInstance(appNode, ReadOnlyElement);
      const button = nullthrows(
        findById(appInstance, 'logbox_dismiss_button_error'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    mimimizeInspector: () => {
      const button = nullthrows(
        findById(logBoxInstance, 'logbox_footer_button_minimize'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    dismissInspector: () => {
      const button = nullthrows(
        findById(logBoxInstance, 'logbox_footer_button_dismiss'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    nextLog: () => {
      const button = nullthrows(
        findById(logBoxInstance, 'logbox_header_button_next'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    previousLog: () => {
      const button = nullthrows(
        findById(logBoxInstance, 'logbox_header_button_prev'),
      );

      Fantom.dispatchNativeEvent(button, 'click');
    },
    getInspectorUI: () => {
      if (findById(logBoxInstance, 'logbox_inspector') == null) {
        return null;
      }
      return findLogBoxInspectorUI(logBoxInstance);
    },
    getNotificationUI: () => {
      if (appNode == null) {
        return null;
      }
      const appInstance = ensureInstance(appNode, ReadOnlyElement);
      if (findById(appInstance, 'logbox_notification') == null) {
        return null;
      }
      return findLogBoxNotificationUI(appInstance);
    },
  };
}
