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

'use strict';

import * as React from 'react';

let Animated = require('../Animated').default;
const createAnimatedComponent_EXPERIMENTAL =
  require('../createAnimatedComponent_EXPERIMENTAL').default;
const createAnimatedComponentInjection = require('../createAnimatedComponentInjection');
let TestRenderer = require('react-test-renderer');

let callback;

function injected<TProps: {...}, TInstance>(
  Component: React.AbstractComponent<TProps, TInstance>,
): React.AbstractComponent<TProps, TInstance> {
  callback();
  return createAnimatedComponent_EXPERIMENTAL(Component);
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
  callback = jest.fn();
});

test('does nothing without injection', () => {
  const opacity = new Animated.Value(0);
  TestRenderer.create(<Animated.View style={{opacity}} />);
  expect(callback.mock.calls.length).toBe(0);
});

test('injection overrides `createAnimatedComponent`', () => {
  createAnimatedComponentInjection.inject(injected);
  const opacity = new Animated.Value(0);
  TestRenderer.create(<Animated.View style={{opacity}} />);
  expect(callback.mock.calls.length).toBe(1);
});

test('injection errors if called too late', () => {
  jest.spyOn(console, 'error').mockReturnValue(undefined);

  const opacity = new Animated.Value(0);
  TestRenderer.create(<Animated.View style={{opacity}} />);

  createAnimatedComponentInjection.inject(injected);

  expect(callback.mock.calls.length).toBe(0);

  expect(console.error).toBeCalledWith(
    'createAnimatedComponentInjection: Must be called before `createAnimatedComponent`.',
  );
});

test('injection errors if called more than once', () => {
  jest.spyOn(console, 'error').mockReturnValue(undefined);

  createAnimatedComponentInjection.inject(injected);

  const opacity = new Animated.Value(0);
  TestRenderer.create(<Animated.View style={{opacity}} />);
  expect(callback.mock.calls.length).toBe(1);

  expect(console.error).not.toBeCalled();

  createAnimatedComponentInjection.inject(injected);

  expect(console.error).toBeCalledWith(
    'createAnimatedComponentInjection: Cannot be called more than once.',
  );
});
