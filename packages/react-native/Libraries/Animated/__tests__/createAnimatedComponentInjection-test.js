/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

'use strict';

const createAnimatedComponent = require('../createAnimatedComponent');
const createAnimatedComponentInjection = require('../createAnimatedComponentInjection');
const React = require('react');

function injected<TProps: {...}, TInstance>(
  Component: React.AbstractComponent<TProps, TInstance>,
): React.AbstractComponent<TProps, TInstance> {
  return createAnimatedComponent(Component);
}

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

test('does nothing without injection', () => {
  expect(typeof createAnimatedComponent).toBe('function');
  expect(createAnimatedComponent).not.toBe(injected);
});

test('injection overrides `createAnimatedComponent`', () => {
  createAnimatedComponentInjection.inject(injected);

  expect(createAnimatedComponent).toBe(injected);
});

test('injection errors if called too late', () => {
  jest.spyOn(console, 'error').mockReturnValue(undefined);

  // Causes `createAnimatedComponent` to be initialized.
  createAnimatedComponent;

  createAnimatedComponentInjection.inject(injected);

  expect(createAnimatedComponent).not.toBe(injected);
  expect(console.error).toBeCalledWith(
    'createAnimatedComponentInjection: Must be called before `createAnimatedComponent`.',
  );
});

test('injection errors if called more than once', () => {
  jest.spyOn(console, 'error').mockReturnValue(undefined);

  createAnimatedComponentInjection.inject(injected);

  expect(createAnimatedComponent).toBe(injected);
  expect(console.error).not.toBeCalled();

  createAnimatedComponentInjection.inject(injected);

  expect(console.error).toBeCalledWith(
    'createAnimatedComponentInjection: Cannot be called more than once.',
  );
});
