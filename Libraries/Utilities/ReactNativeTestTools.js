/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint-env jest */

'use strict';

const React = require('react');

const ReactTestRenderer = require('react-test-renderer');
const ShallowRenderer = require('react-test-renderer/shallow');
/* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.122.0 was deployed. To see the error, delete this comment
 * and run Flow. */
const shallowRenderer = new ShallowRenderer();

import type {ReactTestRenderer as ReactTestRendererType} from 'react-test-renderer';

export type ReactTestInstance = $PropertyType<ReactTestRendererType, 'root'>;

export type Predicate = (node: ReactTestInstance) => boolean;

type $ReturnType<Fn> = $Call<<Ret, A>((...A) => Ret) => Ret, Fn>;
/* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an error
 * found when Flow v0.122.0 was deployed. To see the error, delete this comment
 * and run Flow. */
export type ReactTestRendererJSON = $ReturnType<ReactTestRenderer.create.toJSON>;

const {
  Switch,
  Text,
  TextInput,
  View,
  VirtualizedList,
} = require('react-native');

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
      (node.type === View &&
        node?.props?.onStartShouldSetResponder?.testOnly_pressabilityConfig) ||
      // HACK: Find components that use `Pressability`.
      node.instance?.state?.pressability != null ||
      // TODO: Remove this after deleting `Touchable`.
      /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.122.0 was deployed. To see the error, delete
       * this comment and run Flow. */
      (node.instance &&
        /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses
         * an error found when Flow v0.122.0 was deployed. To see the error,
         * delete this comment and run Flow. */
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
    /* $FlowFixMe(>=0.122.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.122.0 was deployed. To see the error, delete
     * this comment and run Flow. */
    node => node.props && regex.exec(node.props.children),
    `text content matches ${regex.toString()}`,
  );
}

function enter(instance: ReactTestInstance, text: string) {
  const input = instance.findByType(TextInput);
  input.props.onChange && input.props.onChange({nativeEvent: {text}});
  input.props.onChangeText && input.props.onChangeText(text);
}

// Returns null if there is no error, otherwise returns an error message string.
function maximumDepthError(
  tree: ReactTestRendererType,
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

function expectRendersMatchingSnapshot(
  name: string,
  ComponentProvider: () => React.Element<any>,
  unmockComponent: () => mixed,
) {
  let instance;

  jest.resetAllMocks();

  instance = ReactTestRenderer.create(<ComponentProvider />);
  expect(instance).toMatchSnapshot(
    'should deep render when mocked (please verify output manually)',
  );

  jest.resetAllMocks();
  unmockComponent();

  instance = shallowRenderer.render(<ComponentProvider />);
  expect(instance).toMatchSnapshot(
    `should shallow render as <${name} /> when not mocked`,
  );

  jest.resetAllMocks();

  instance = shallowRenderer.render(<ComponentProvider />);
  expect(instance).toMatchSnapshot(
    `should shallow render as <${name} /> when mocked`,
  );

  jest.resetAllMocks();
  unmockComponent();

  instance = ReactTestRenderer.create(<ComponentProvider />);
  expect(instance).toMatchSnapshot(
    'should deep render when not mocked (please verify output manually)',
  );
}

// Takes a node from toJSON()
function maximumDepthOfJSON(node: ?ReactTestRendererJSON): number {
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

function renderAndEnforceStrictMode(element: React.Node): any {
  expectNoConsoleError();
  return renderWithStrictMode(element);
}

function renderWithStrictMode(element: React.Node): ReactTestRendererType {
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
  } else if (
    touchable?.props?.onStartShouldSetResponder?.testOnly_pressabilityConfig
  ) {
    const {
      onPress,
      disabled,
    } = touchable.props.onStartShouldSetResponder.testOnly_pressabilityConfig();
    if (!disabled) {
      onPress({nativeEvent: {}});
    }
  } else {
    // Only tap when props.disabled isn't set (or there aren't any props)
    if (!touchable.props || !touchable.props.disabled) {
      touchable.props.onPress({nativeEvent: {}});
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
export {expectRendersMatchingSnapshot};
export {maximumDepthError};
export {maximumDepthOfJSON};
export {renderAndEnforceStrictMode};
export {renderWithStrictMode};
export {scrollToBottom};
export {tap};
export {withMessage};
