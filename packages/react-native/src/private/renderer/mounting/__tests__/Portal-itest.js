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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import {createPortal} from 'react-native/Libraries/ReactNative/RendererProxy';

describe('Portal', () => {
  test('renders children into target view', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({showPortal}: {showPortal: boolean}) {
      return (
        <View nativeID="root">
          <View>
            {showPortal
              ? createPortal(
                  <View nativeID="portaled-child" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate the ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    expect(targetRef.current).not.toBeNull();

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });

    // Portal child should appear inside the target view
    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-child'}, children: []},
          ],
        },
      ],
    });
  });

  test('unmounts portal children from target view', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({showPortal}: {showPortal: boolean}) {
      return (
        <View nativeID="root">
          <View>
            {showPortal
              ? createPortal(
                  <View nativeID="portaled-child" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    expect(targetRef.current).not.toBeNull();

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-child'}, children: []},
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
      props: {nativeID: 'root'},
      children: [{type: 'View', props: {nativeID: 'target'}, children: []}],
    });
  });

  test('preserves React context through portals', () => {
    const root = Fantom.createRoot();
    let capturedTheme: ?string = null;
    const targetRef = React.createRef<HostInstance>();
    const ThemeContext = React.createContext<string>('light');

    function ContextReader() {
      capturedTheme = React.useContext(ThemeContext);
      return <View nativeID="context-child" />;
    }

    function TestComponent({showPortal}: {showPortal: boolean}) {
      return (
        <ThemeContext.Provider value="dark">
          <View nativeID="root">
            <View>
              {showPortal
                ? createPortal(<ContextReader />, targetRef.current)
                : null}
            </View>
            <View ref={targetRef} nativeID="target" collapsable={false} />
          </View>
        </ThemeContext.Provider>
      );
    }

    // Initial render to populate ref
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
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({
      showPortal,
      counter,
    }: {
      showPortal: boolean,
      counter: number,
    }) {
      return (
        <View nativeID="root">
          <View>
            {showPortal
              ? createPortal(
                  <View nativeID={'portaled-' + counter} />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
          <View nativeID={'counter-' + counter} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} counter={0} />);
    });

    // Mount portal
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={0} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-0'}, children: []},
          ],
        },
        {type: 'View', props: {nativeID: 'counter-0'}, children: []},
      ],
    });

    // Re-render: portal content should update
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={1} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-1'}, children: []},
          ],
        },
        {type: 'View', props: {nativeID: 'counter-1'}, children: []},
      ],
    });

    // Re-render again
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={true} counter={2} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-2'}, children: []},
          ],
        },
        {type: 'View', props: {nativeID: 'counter-2'}, children: []},
      ],
    });
  });

  test('mount and unmount cycle works multiple times', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({showPortal}: {showPortal: boolean}) {
      return (
        <View nativeID="root">
          <View>
            {showPortal
              ? createPortal(
                  <View nativeID="portaled-child" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal={false} />);
    });

    const withPortal = {
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portaled-child'}, children: []},
          ],
        },
      ],
    };

    const withoutPortal = {
      type: 'View',
      props: {nativeID: 'root'},
      children: [{type: 'View', props: {nativeID: 'target'}, children: []}],
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

  test('multiple portals to same target', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({
      showPortal1,
      showPortal2,
    }: {
      showPortal1: boolean,
      showPortal2: boolean,
    }) {
      return (
        <View nativeID="root">
          <View>
            {showPortal1
              ? createPortal(
                  <View nativeID="portal-child-1" />,
                  targetRef.current,
                )
              : null}
            {showPortal2
              ? createPortal(
                  <View nativeID="portal-child-2" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={false} showPortal2={false} />);
    });

    expect(targetRef.current).not.toBeNull();

    // Mount both unkeyed portals
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={true} showPortal2={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portal-child-1'}, children: []},
            {type: 'View', props: {nativeID: 'portal-child-2'}, children: []},
          ],
        },
      ],
    });
  });

  test('selective unmount of portals', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({
      showPortal1,
      showPortal2,
    }: {
      showPortal1: boolean,
      showPortal2: boolean,
    }) {
      return (
        <View nativeID="root">
          <View>
            {showPortal1
              ? createPortal(
                  <View nativeID="portal-child-1" />,
                  targetRef.current,
                )
              : null}
            {showPortal2
              ? createPortal(
                  <View nativeID="portal-child-2" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={false} showPortal2={false} />);
    });

    // Mount both
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={true} showPortal2={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portal-child-1'}, children: []},
            {type: 'View', props: {nativeID: 'portal-child-2'}, children: []},
          ],
        },
      ],
    });

    // Unmount portal 2, portal 1 survives
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={true} showPortal2={false} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portal-child-1'}, children: []},
          ],
        },
      ],
    });

    // Unmount portal 1 too
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={false} showPortal2={false} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [{type: 'View', props: {nativeID: 'target'}, children: []}],
    });
  });

  test('remove first portal in list, second survives', () => {
    const root = Fantom.createRoot();
    const targetRef = React.createRef<HostInstance>();

    function TestComponent({
      showPortal1,
      showPortal2,
    }: {
      showPortal1: boolean,
      showPortal2: boolean,
    }) {
      return (
        <View nativeID="root">
          <View>
            {showPortal1
              ? createPortal(
                  <View nativeID="portal-child-1" />,
                  targetRef.current,
                )
              : null}
            {showPortal2
              ? createPortal(
                  <View nativeID="portal-child-2" />,
                  targetRef.current,
                )
              : null}
          </View>
          <View ref={targetRef} nativeID="target" collapsable={false} />
        </View>
      );
    }

    // Initial render to populate ref
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={false} showPortal2={false} />);
    });

    // Mount both
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={true} showPortal2={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portal-child-1'}, children: []},
            {type: 'View', props: {nativeID: 'portal-child-2'}, children: []},
          ],
        },
      ],
    });

    // Remove first portal (index 0), second survives
    Fantom.runTask(() => {
      root.render(<TestComponent showPortal1={false} showPortal2={true} />);
    });

    expect(root.getRenderedOutput().toJSON()).toEqual({
      type: 'View',
      props: {nativeID: 'root'},
      children: [
        {
          type: 'View',
          props: {nativeID: 'target'},
          children: [
            {type: 'View', props: {nativeID: 'portal-child-2'}, children: []},
          ],
        },
      ],
    });
  });
});
