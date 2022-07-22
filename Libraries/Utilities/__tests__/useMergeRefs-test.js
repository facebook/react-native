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

import useMergeRefs from '../useMergeRefs';
import * as React from 'react';
import {View} from 'react-native';
import {act, create} from 'react-test-renderer';

/**
 * TestView provide a component execution environment to test hooks.
 */
/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function TestView({name, refs}) {
  const mergeRef = useMergeRefs(...refs);
  return <View ref={mergeRef} testID={name} />;
}

/**
 * TestViewInstance provides a pretty-printable replacement for React instances.
 */
class TestViewInstance {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  // $FlowIgnore[unclear-type] - Intentional.
  static fromValue(value: any): ?TestViewInstance {
    const testID = value?.props?.testID;
    return testID == null ? null : new TestViewInstance(testID);
  }

  static named(name: string) {
    // $FlowIssue[prop-missing] - Flow does not support type augmentation.
    return expect.testViewInstance(name);
  }
}

/**
 * extend.testViewInstance makes it easier to assert expected values. But use
 * TestViewInstance.named instead of extend.testViewInstance because of Flow.
 */
expect.extend({
  testViewInstance(received, name) {
    const pass = received instanceof TestViewInstance && received.name === name;
    return {pass};
  },
});

/**
 * Creates a registry that records the values assigned to the mock refs created
 * by either of the two returned callbacks.
 */
function mockRefRegistry<T>(): {
  mockCallbackRef: (name: string) => T => mixed,
  mockObjectRef: (name: string) => {current: T, ...},
  registry: $ReadOnlyArray<{[string]: T}>,
} {
  const registry = [];
  return {
    mockCallbackRef:
      (name: string): (T => mixed) =>
      current => {
        registry.push({[name]: TestViewInstance.fromValue(current)});
      },
    mockObjectRef: (name: string): {current: T, ...} => ({
      // $FlowIgnore[unsafe-getters-setters] - Intentional.
      set current(current) {
        registry.push({[name]: TestViewInstance.fromValue(current)});
      },
    }),
    registry,
  };
}

test('accepts a callback ref', () => {
  let root;

  const {mockCallbackRef, registry} = mockRefRegistry();
  const refA = mockCallbackRef('refA');

  act(() => {
    root = create(<TestView name="foo" refs={[refA]} />);
  });

  expect(registry).toEqual([{refA: TestViewInstance.named('foo')}]);

  act(() => {
    root = create(<TestView name="bar" refs={[refA]} />);
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refA: TestViewInstance.named('bar')},
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refA: TestViewInstance.named('bar')},
    {refA: null},
  ]);
});

test('accepts an object ref', () => {
  let root;

  const {mockObjectRef, registry} = mockRefRegistry();
  const refA = mockObjectRef('refA');

  act(() => {
    root = create(<TestView name="foo" refs={[refA]} />);
  });

  expect(registry).toEqual([{refA: TestViewInstance.named('foo')}]);

  act(() => {
    root = create(<TestView name="bar" refs={[refA]} />);
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refA: TestViewInstance.named('bar')},
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refA: TestViewInstance.named('bar')},
    {refA: null},
  ]);
});

test('invokes refs in order', () => {
  let root;

  const {mockCallbackRef, mockObjectRef, registry} = mockRefRegistry();
  const refA = mockCallbackRef('refA');
  const refB = mockObjectRef('refB');
  const refC = mockCallbackRef('refC');
  const refD = mockObjectRef('refD');

  act(() => {
    root = create(<TestView name="foo" refs={[refA, refB, refC, refD]} />);
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
    {refC: TestViewInstance.named('foo')},
    {refD: TestViewInstance.named('foo')},
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
    {refC: TestViewInstance.named('foo')},
    {refD: TestViewInstance.named('foo')},
    {refA: null},
    {refB: null},
    {refC: null},
    {refD: null},
  ]);
});

// This is actually undesirable behavior, but it's what we have so let's make
// sure it does not change unexpectedly.
test('invokes all refs if any ref changes', () => {
  let root;

  const {mockCallbackRef, registry} = mockRefRegistry();
  const refA = mockCallbackRef('refA');
  const refB = mockCallbackRef('refB');

  act(() => {
    root = create(<TestView name="foo" refs={[refA, refB]} />);
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
  ]);

  const refAPrime = mockCallbackRef('refAPrime');
  act(() => {
    root.update(<TestView name="foo" refs={[refAPrime, refB]} />);
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
    {refA: null},
    {refB: null},
    {refAPrime: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    {refA: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
    {refA: null},
    {refB: null},
    {refAPrime: TestViewInstance.named('foo')},
    {refB: TestViewInstance.named('foo')},
    {refAPrime: null},
    {refB: null},
  ]);
});
