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

import type { HostInstance } from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import { View } from 'react-native';
import { createPortal } from 'react-native/Libraries/ReactNative/RendererProxy';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function getTargetTag(ref: { current: HostInstance | null }): number {
  const element = ensureInstance(ref.current, ReactNativeElement);
  return element.__nativeTag;
}

describe('Portal', () => {
  test('renders children into target view', () => {
    const root = Fantom.createRoot();
    let targetTag: ?number = null;
    const targetRef = React.createRef < HostInstance > ();

    function TestComponent({ showPortal }: { showPortal: boolean }) {
      React.useLayoutEffect(() => {
        if (targetRef.current) {
          targetTag = getTargetTag(targetRef);
        }
      }, []);

      return (
        <View nativeID="root">
          <View>
            {showPortal && targetTag != null
              ? createPortal(
                <View nativeID="portaled-child" />,
                targetTag,
              )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to get the target tag
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    expect(targetTag).not.toBeNull();

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });

    // Portal child should appear inside the target view
    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-child' }, children: [] },
          ],
        },
      ],
    });
  });

  test('unmounts portal children from target view', () => {
    const root = Fantom.createRoot();
    let targetTag: ?number = null;
    const targetRef = React.createRef < HostInstance > ();

    function TestComponent({ showPortal }: { showPortal: boolean }) {
      React.useLayoutEffect(() => {
        if (targetRef.current) {
          targetTag = getTargetTag(targetRef);
        }
      }, []);

      return (
        <View nativeID="root">
          <View>
            {showPortal && targetTag != null
              ? createPortal(
                <View nativeID="portaled-child" />,
                targetTag,
              )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    expect(targetTag).not.toBeNull();

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-child' }, children: [] },
          ],
        },
      ],
    });

    // Unmount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    // Portal child should be removed from target view
    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        { type: 'View', props: { nativeID: 'target' }, children: [] },
      ],
    });
  });

  test('preserves React context through portals', () => {
    const root = Fantom.createRoot();
    let targetTag: ?number = null;
    let capturedTheme: ?string = null;
    const targetRef = React.createRef < HostInstance > ();
    const ThemeContext = React.createContext < string > ('light');

    function ContextReader() {
      capturedTheme = React.useContext(ThemeContext);
      return <View nativeID="context-child" />;
    }

    function TestComponent({ showPortal }: { showPortal: boolean }) {
      React.useLayoutEffect(() => {
        if (targetRef.current) {
          targetTag = getTargetTag(targetRef);
        }
      }, []);

      return (
        <ThemeContext.Provider value="dark">
          <View nativeID="root">
            <View>
              {showPortal && targetTag != null
                ? createPortal(<ContextReader />, targetTag)
                : null}
            </View>
            <View ref={targetRef} nativeID="target" collapsable={false} />
          </View>
        </ThemeContext.Provider>
      );
    }

    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });

    expect(capturedTheme).toBe('dark');
  });

  test('does not duplicate portal children on re-render and updates content', () => {
    const root = Fantom.createRoot();
    let targetTag: ?number = null;
    const targetRef = React.createRef < HostInstance > ();

    function TestComponent({
      showPortal,
      counter,
    }: {
      showPortal: boolean,
      counter: number,
    }) {
      React.useLayoutEffect(() => {
        if (targetRef.current) {
          targetTag = getTargetTag(targetRef);
        }
      }, []);

      return (
        <View nativeID="root">
          <View>
            {showPortal && targetTag != null
              ? createPortal(
                <View nativeID={'portaled-' + counter} />,
                targetTag,
              )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
          <View nativeID={'counter-' + counter} />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} counter={0} />);
    });

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={0} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-0' }, children: [] },
          ],
        },
        { type: 'View', props: { nativeID: 'counter-0' }, children: [] },
      ],
    });

    // Re-render: portal content should update
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={1} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-1' }, children: [] },
          ],
        },
        { type: 'View', props: { nativeID: 'counter-1' }, children: [] },
      ],
    });

    // Re-render again
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={2} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-2' }, children: [] },
          ],
        },
        { type: 'View', props: { nativeID: 'counter-2' }, children: [] },
      ],
    });
  });

  test('mount and unmount cycle works multiple times', () => {
    const root = Fantom.createRoot();
    let targetTag: ?number = null;
    const targetRef = React.createRef < HostInstance > ();

    function TestComponent({ showPortal }: { showPortal: boolean }) {
      React.useLayoutEffect(() => {
        if (targetRef.current) {
          targetTag = getTargetTag(targetRef);
        }
      }, []);

      return (
        <View nativeID="root">
          <View>
            {showPortal && targetTag != null
              ? createPortal(
                <View nativeID="portaled-child" />,
                targetTag,
              )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    const withPortal = {
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        {
          type: 'View',
          props: { nativeID: 'target' },
          children: [
            { type: 'View', props: { nativeID: 'portaled-child' }, children: [] },
          ],
        },
      ],
    };

    const withoutPortal = {
      type: 'View',
      props: { nativeID: 'root' },
      children: [
        { type: 'View', props: { nativeID: 'target' }, children: [] },
      ],
    };

    // mount
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });
    expect(root.getRenderedOutput().toJSON()).toEqual(withPortal);

    // unmount
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });
    expect(root.getRenderedOutput().toJSON()).toEqual(withoutPortal);

    // mount
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });
    expect(root.getRenderedOutput().toJSON()).toEqual(withPortal);

    // unmount
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });
    expect(root.getRenderedOutput().toJSON()).toEqual(withoutPortal);
  });
});
