/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');

const {Switch, Text, TextInput, VirtualizedList} = require('react-native');

import type {
  ReactTestInstance,
  ReactTestRendererNode,
  Predicate,
} from 'react-test-renderer';

function byClickable(): Predicate {
  return withMessage(
    node =>
      // note: <Text /> lazy-mounts press handlers after the first press,
      //       so this is a workaround for targeting text nodes.
      (node.type === Text &&
        node.props &&
        typeof node.props.onPress === 'function') ||
      // note: Special casing <Switch /> since it doesn't use touchable
      (node.type === Switch && node.props && node.props.disabled !== true) ||
      (node.instance &&
        typeof node.instance.touchableHandlePress === 'function'),
    'is clickable',
  );
}

function byTestID(testID: string): Predicate {
  return withMessage(
    node => node.props && node.props.testID === testID,
    `testID prop equals ${testID}`,
  );
}

function byTextMatching(regex: RegExp): Predicate {
  return withMessage(
    node => node.props && regex.exec(node.props.children),
    `text content matches ${regex.toString()}`,
  );
}

function enter(instance: ReactTestInstance, text: string) {
  const input = instance.findByType(TextInput);
  input.instance._onChange({nativeEvent: {text}});
}

// Returns null if there is no error, otherwise returns an error message string.
function maximumDepthError(
  tree: {toJSON: () => ReactTestRendererNode},
  maxDepthLimit: number,
): ?string {
  const maxDepth = maximumDepthOfJSON(tree.toJSON());
  if (maxDepth > maxDepthLimit) {
    return (
      `maximumDepth of ${maxDepth} exceeded limit of ${maxDepthLimit} - this is a proxy ` +
      'metric to protect against stack overflow errors:\n\n' +
      'https://fburl.com/rn-view-stack-overflow.\n\n' +
      'To fix, you need to remove native layers from your hierarchy, such as unnecessary View ' +
      'wrappers.'
    );
  } else {
    return null;
  }
}

function expectNoConsoleWarn() {
  (jest: $FlowFixMe).spyOn(console, 'warn').mockImplementation((...args) => {
    expect(args).toBeFalsy();
  });
}

function expectNoConsoleError() {
  let hasNotFailed = true;
  (jest: $FlowFixMe).spyOn(console, 'error').mockImplementation((...args) => {
    if (hasNotFailed) {
      hasNotFailed = false; // set false to prevent infinite recursion
      expect(args).toBeFalsy();
    }
  });
}

// Takes a node from toJSON()
function maximumDepthOfJSON(node: ReactTestRendererNode): number {
  if (node == null) {
    return 0;
  } else if (typeof node === 'string' || node.children == null) {
    return 1;
  } else {
    let maxDepth = 0;
    node.children.forEach(child => {
      maxDepth = Math.max(maximumDepthOfJSON(child) + 1, maxDepth);
    });
    return maxDepth;
  }
}

function renderAndEnforceStrictMode(element: React.Node) {
  expectNoConsoleError();
  return renderWithStrictMode(element);
}

function renderWithStrictMode(element: React.Node) {
  const WorkAroundBugWithStrictModeInTestRenderer = prps => prps.children;
  const StrictMode = (React: $FlowFixMe).StrictMode;
  return ReactTestRenderer.create(
    <WorkAroundBugWithStrictModeInTestRenderer>
      <StrictMode>{element}</StrictMode>
    </WorkAroundBugWithStrictModeInTestRenderer>,
  );
}

function tap(instance: ReactTestInstance) {
  const touchable = instance.find(byClickable());
  if (touchable.type === Text && touchable.props && touchable.props.onPress) {
    touchable.props.onPress();
  } else if (touchable.type === Switch && touchable.props) {
    const value = !touchable.props.value;
    const {onChange, onValueChange} = touchable.props;
    onChange && onChange({nativeEvent: {value}});
    onValueChange && onValueChange(value);
  } else {
    // Only tap when props.disabled isn't set (or there aren't any props)
    if (!touchable.props || !touchable.props.disabled) {
      touchable.instance.touchableHandlePress({nativeEvent: {}});
    }
  }
}

function scrollToBottom(instance: ReactTestInstance) {
  const list = instance.findByType(VirtualizedList);
  list.props && list.props.onEndReached();
}

// To make error messages a little bit better, we attach a custom toString
// implementation to a predicate
function withMessage(fn: Predicate, message: string): Predicate {
  (fn: any).toString = () => message;
  return fn;
}

export {byClickable};
export {byTestID};
export {byTextMatching};
export {enter};
export {expectNoConsoleWarn};
export {expectNoConsoleError};
export {maximumDepthError};
export {maximumDepthOfJSON};
export {renderAndEnforceStrictMode};
export {renderWithStrictMode};
export {scrollToBottom};
export {tap};
export {withMessage};
