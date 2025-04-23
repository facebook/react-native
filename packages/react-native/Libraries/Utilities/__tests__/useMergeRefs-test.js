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

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {ReactTestRenderer} from 'react-test-renderer';

import View from '../../Components/View/View';
import useMergeRefs from '../useMergeRefs';
import * as React from 'react';
import {act, create} from 'react-test-renderer';

class Screen {
  #root: ?ReactTestRenderer;

  render(children: () => React.MixedElement): void {
    act(() => {
      if (this.#root == null) {
        this.#root = create(<TestComponent>{children}</TestComponent>);
      } else {
        this.#root.update(<TestComponent>{children}</TestComponent>);
      }
    });
  }

  unmount(): void {
    act(() => {
      this.#root?.unmount();
    });
  }
}

function TestComponent(
  props: $ReadOnly<{children: () => React.MixedElement}>,
): React.Node {
  return props.children();
}

function id(instance: HostInstance | null): string | null {
  // $FlowIgnore[prop-missing] - Intentional.
  return instance?.props?.id ?? null;
}

test('accepts a ref callback', () => {
  const screen = new Screen();
  const ledger: Array<{[string]: string | null}> = [];

  const ref = (current: HostInstance | null) => {
    ledger.push({ref: id(current)});
  };

  screen.render(() => <View id="foo" key="foo" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}]);

  screen.render(() => <View id="bar" key="bar" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  screen.unmount();

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('accepts a ref callback that returns a cleanup function', () => {
  const screen = new Screen();
  const ledger: Array<{[string]: string | null}> = [];

  // TODO: Remove `| null` after Flow supports ref cleanup functions.
  const ref = (current: HostInstance | null) => {
    ledger.push({ref: id(current)});
    return () => {
      ledger.push({ref: null});
    };
  };

  screen.render(() => <View id="foo" key="foo" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}]);

  screen.render(() => <View id="bar" key="bar" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  screen.unmount();

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('accepts a ref object', () => {
  const screen = new Screen();
  const ledger: Array<{[string]: string | null}> = [];

  const ref = {
    // $FlowIgnore[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({ref: id(current)});
    },
  };

  screen.render(() => <View id="foo" key="foo" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}]);

  screen.render(() => <View id="bar" key="bar" ref={useMergeRefs(ref)} />);

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  screen.unmount();

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('invokes refs in order', () => {
  const screen = new Screen();
  const ledger: Array<{[string]: string | null}> = [];

  const refA = (current: HostInstance | null) => {
    ledger.push({refA: id(current)});
  };
  const refB = {
    // $FlowIgnore[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({refB: id(current)});
    },
  };
  const refC = (current: HostInstance | null) => {
    ledger.push({refC: id(current)});
  };
  const refD = {
    // $FlowIgnore[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({refD: id(current)});
    },
  };

  screen.render(() => (
    <View id="foo" key="foo" ref={useMergeRefs(refA, refB, refC, refD)} />
  ));

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refC: 'foo'},
    {refD: 'foo'},
  ]);

  screen.unmount();

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refC: 'foo'},
    {refD: 'foo'},
    {refA: null},
    {refB: null},
    {refC: null},
    {refD: null},
  ]);
});

// This is actually undesirable behavior, but it's what we have so let's make
// sure it does not change unexpectedly.
test('invokes all refs if any ref changes', () => {
  const screen = new Screen();
  const ledger: Array<{[string]: string | null}> = [];

  const refA = (current: HostInstance | null) => {
    ledger.push({refA: id(current)});
  };
  const refB = (current: HostInstance | null) => {
    ledger.push({refB: id(current)});
  };

  screen.render(() => (
    <View id="foo" key="foo" ref={useMergeRefs(refA, refB)} />
  ));

  const refAPrime = (current: HostInstance | null) => {
    ledger.push({refAPrime: id(current)});
  };

  screen.render(() => (
    <View id="foo" key="foo" ref={useMergeRefs(refAPrime, refB)} />
  ));

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refA: null},
    {refB: null},
    {refAPrime: 'foo'},
    {refB: 'foo'},
  ]);

  screen.unmount();

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refA: null},
    {refB: null},
    {refAPrime: 'foo'},
    {refB: 'foo'},
    {refAPrime: null},
    {refB: null},
  ]);
});
