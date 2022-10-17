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

import View from '../../Components/View/View';
import useRefEffect from '../useRefEffect';
import * as React from 'react';
import {act, create} from 'react-test-renderer';

/**
 * TestView provide a component execution environment to test hooks.
 */
function TestView({
  childKey = null,
  effect,
}:
  | $FlowFixMe
  | $TEMPORARY$object<{
      childKey: $TEMPORARY$string<'bar'>,
      effect: () => () => void,
    }>
  | $TEMPORARY$object<{childKey: $TEMPORARY$string<'foo'>, effect: () => void}>
  | $TEMPORARY$object<{
      childKey: $TEMPORARY$string<'foo'>,
      effect: () => () => void,
    }>) {
  const ref = useRefEffect(effect);
  return <View key={childKey} ref={ref} testID={childKey} />;
}

/**
 * TestEffect represents an effect invocation.
 */
class TestEffect {
  name: string;
  key: ?string;
  constructor(name: string, key: ?string) {
    this.name = name;
    this.key = key;
  }
  static called(name: string, key: ?string): $FlowFixMe {
    // $FlowIssue[prop-missing] - Flow does not support type augmentation.
    return expect.effect(name, key);
  }
}

/**
 * TestEffectCleanup represents an effect cleanup invocation.
 */
class TestEffectCleanup {
  name: string;
  key: ?string;
  constructor(name: string, key: ?string) {
    this.name = name;
    this.key = key;
  }
  static called(name: string, key: ?string): $FlowFixMe {
    // $FlowIssue[prop-missing] - Flow does not support type augmentation.
    return expect.effectCleanup(name, key);
  }
}

/**
 * extend.effect and expect.extendCleanup make it easier to assert expected
 * values. But use TestEffect.called and TestEffectCleanup.called instead of
 * extend.effect and expect.extendCleanup because of Flow.
 */
expect.extend({
  effect(received, name, key) {
    const pass =
      received instanceof TestEffect &&
      received.name === name &&
      received.key === key;
    return {pass};
  },
  effectCleanup(received, name, key) {
    const pass =
      received instanceof TestEffectCleanup &&
      received.name === name &&
      received.key === key;
    return {pass};
  },
});

function mockEffectRegistry(): {
  mockEffect: string => () => () => void,
  mockEffectWithoutCleanup: string => () => void,
  registry: $ReadOnlyArray<TestEffect | TestEffectCleanup>,
} {
  const registry: Array<TestEffect | TestEffectCleanup> = [];
  return {
    mockEffect(name: string): () => () => void {
      return instance => {
        const key = instance?.props?.testID;
        registry.push(new TestEffect(name, key));
        return () => {
          registry.push(new TestEffectCleanup(name, key));
        };
      };
    },
    mockEffectWithoutCleanup(name: string): () => void {
      return instance => {
        const key = instance?.props?.testID;
        registry.push(new TestEffect(name, key));
      };
    },
    registry,
  };
}

test('calls effect without cleanup', () => {
  let root;

  const {mockEffectWithoutCleanup, registry} = mockEffectRegistry();
  const effectA = mockEffectWithoutCleanup('A');

  act(() => {
    root = create(<TestView childKey="foo" effect={effectA} />);
  });

  expect(registry).toEqual([TestEffect.called('A', 'foo')]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([TestEffect.called('A', 'foo')]);
});

test('calls effect and cleanup', () => {
  let root;

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');

  act(() => {
    root = create(<TestView childKey="foo" effect={effectA} />);
  });

  expect(registry).toEqual([TestEffect.called('A', 'foo')]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
  ]);
});

test('cleans up old effect before calling new effect', () => {
  let root;

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');
  const effectB = mockEffect('B');

  act(() => {
    root = create(<TestView childKey="foo" effect={effectA} />);
  });

  act(() => {
    root.update(<TestView childKey="foo" effect={effectB} />);
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('B', 'foo'),
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('B', 'foo'),
    TestEffectCleanup.called('B', 'foo'),
  ]);
});

test('calls cleanup and effect on new instance', () => {
  let root;

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');

  act(() => {
    root = create(<TestView childKey="foo" effect={effectA} />);
  });

  act(() => {
    root.update(<TestView childKey="bar" effect={effectA} />);
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('A', 'bar'),
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('A', 'bar'),
    TestEffectCleanup.called('A', 'bar'),
  ]);
});

test('cleans up old effect before calling new effect with new instance', () => {
  let root;

  const {mockEffect, registry} = mockEffectRegistry();
  const effectA = mockEffect('A');
  const effectB = mockEffect('B');

  act(() => {
    root = create(<TestView childKey="foo" effect={effectA} />);
  });

  act(() => {
    root.update(<TestView childKey="bar" effect={effectB} />);
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('B', 'bar'),
  ]);

  act(() => {
    root.unmount();
  });

  expect(registry).toEqual([
    TestEffect.called('A', 'foo'),
    TestEffectCleanup.called('A', 'foo'),
    TestEffect.called('B', 'bar'),
    TestEffectCleanup.called('B', 'bar'),
  ]);
});
