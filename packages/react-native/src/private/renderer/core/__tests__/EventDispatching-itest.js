/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags fixMappingOfEventPrioritiesBetweenFabricAndReact:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {View} from 'react-native';
import * as FabricUIManager from 'react-native/Libraries/ReactNative/FabricUIManager';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

const UIManager = nullthrows(FabricUIManager.getFabricUIManager());

describe('Event Dispatching', () => {
  it('dispatches events with discrete priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerUpPriority;

    const onPointerUp = jest.fn((event: mixed) => {
      onPointerUpPriority = UIManager.unstable_getCurrentEventPriority();
    });

    Fantom.runTask(() => {
      root.render(<View ref={ref} onPointerUp={onPointerUp} />);
    });

    expect(onPointerUp).toHaveBeenCalledTimes(0);

    const node = ensureInstance(ref.current, ReactNativeElement);

    Fantom.dispatchNativeEvent(
      node,
      'onPointerUp',
      {x: 0, y: 0},
      {
        category: Fantom.NativeEventCategory.Discrete,
      },
    );

    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onPointerUpPriority).toBe(UIManager.unstable_DiscreteEventPriority);
  });

  it('dispatches events with continuous priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerMovePriority;

    const onPointerMove = jest.fn((event: mixed) => {
      onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
    });

    Fantom.runTask(() => {
      root.render(<View ref={ref} onPointerMove={onPointerMove} />);
    });

    expect(onPointerMove).toHaveBeenCalledTimes(0);

    const node = ensureInstance(ref.current, ReactNativeElement);

    Fantom.dispatchNativeEvent(
      node,
      'onPointerMove',
      {x: 0, y: 0},
      {
        category: Fantom.NativeEventCategory.Continuous,
      },
    );

    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerMovePriority).toBe(
      UIManager.unstable_ContinuousEventPriority,
    );
  });

  it('dispatches events with idle priority', () => {
    const root = Fantom.createRoot();

    const ref = React.createRef<React.ElementRef<typeof View>>();

    let onPointerMovePriority;

    const onPointerMove = jest.fn((event: mixed) => {
      onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
    });

    Fantom.runTask(() => {
      root.render(<View ref={ref} onPointerMove={onPointerMove} />);
    });

    expect(onPointerMove).toHaveBeenCalledTimes(0);

    const node = ensureInstance(ref.current, ReactNativeElement);

    Fantom.dispatchNativeEvent(
      node,
      'onPointerMove',
      {x: 0, y: 0},
      {
        // This is not the intrinsic category of this event,
        // but we don't currently dispatch any idle events on View and need a real prop for testing.
        category: Fantom.NativeEventCategory.Idle,
      },
    );

    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerMovePriority).toBe(UIManager.unstable_IdleEventPriority);
  });

  describe('when using ContinuousStart and ContinuousEnd', () => {
    it('uses discrete event priority for both ContinousStart and ContinuousEnd', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerEnterPriority;
      let onPointerLeavePriority;

      const onPointerEnter = jest.fn((event: mixed) => {
        onPointerEnterPriority = UIManager.unstable_getCurrentEventPriority();
      });
      const onPointerLeave = jest.fn((event: mixed) => {
        onPointerLeavePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(
          <View
            ref={ref}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
          />,
        );
      });

      expect(onPointerEnter).toHaveBeenCalledTimes(0);
      expect(onPointerLeave).toHaveBeenCalledTimes(0);

      const node = ensureInstance(ref.current, ReactNativeElement);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onPointerLeave).toHaveBeenCalledTimes(0);
      expect(onPointerEnterPriority).toBe(
        UIManager.unstable_DiscreteEventPriority,
      );

      Fantom.dispatchNativeEvent(
        node,
        'onPointerLeave',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousEnd,
        },
      );

      expect(onPointerEnter).toHaveBeenCalledTimes(1);
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
      expect(onPointerLeavePriority).toBe(
        UIManager.unstable_DiscreteEventPriority,
      );
    });

    it('uses continuous event priority for unspecified events between ContinuousStart and ContinuousEnd, and default outside of them', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerMovePriority;
      const onPointerMove = jest.fn((event: mixed) => {
        onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      const node = ensureInstance(ref.current, ReactNativeElement);
      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_DefaultEventPriority,
      );

      Fantom.dispatchNativeEvent(
        node,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(2);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_ContinuousEventPriority,
      );

      Fantom.dispatchNativeEvent(
        node,
        'onPointerLeave',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousEnd,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(2);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Unspecified,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(3);
      expect(onPointerMovePriority).toBe(
        UIManager.unstable_DefaultEventPriority,
      );
    });

    it('preserves explicitly set priorities between ContinuousStart and ContinuousEnd', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      let onPointerMovePriority;
      const onPointerMove = jest.fn((event: mixed) => {
        onPointerMovePriority = UIManager.unstable_getCurrentEventPriority();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      const node = ensureInstance(ref.current, ReactNativeElement);
      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerEnter',
        {x: 0, y: 0},
        {
          category: Fantom.NativeEventCategory.ContinuousStart,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      Fantom.dispatchNativeEvent(
        node,
        'onPointerMove',
        {x: 0, y: 1},
        {
          category: Fantom.NativeEventCategory.Idle,
        },
      );

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMovePriority).toBe(UIManager.unstable_IdleEventPriority);
    });
  });

  describe('unique events', () => {
    it('are combined and only the last consecutive one is dispatched', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      const node = ensureInstance(ref.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.y).toBe(1);
    });

    it('are combined if there are different event types in between for a different target', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();
      const otherRef = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(
          <>
            <View ref={ref} onPointerMove={onPointerMove} />
            <View ref={otherRef} />
          </>,
        );
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      const node = ensureInstance(ref.current, ReactNativeElement);
      const otherNode = ensureInstance(otherRef.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          otherNode,
          'onScroll',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.lastCall[0].nativeEvent.y).toBe(1);
    });

    it('are NOT combined if there are different event types in between for the same target', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      const node = ensureInstance(ref.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onScroll',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(2);
    });

    it('are NOT combined with the same type if it is non-unique', () => {
      const root = Fantom.createRoot();

      const ref = React.createRef<React.ElementRef<typeof View>>();

      const onPointerMove = jest.fn(e => {
        e.persist();
      });

      Fantom.runTask(() => {
        root.render(<View ref={ref} onPointerMove={onPointerMove} />);
      });

      expect(onPointerMove).toHaveBeenCalledTimes(0);

      const node = ensureInstance(ref.current, ReactNativeElement);

      Fantom.runOnUIThread(() => {
        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 0, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 0},
          {
            category: Fantom.NativeEventCategory.Continuous,
          },
        );

        Fantom.enqueueNativeEvent(
          node,
          'onPointerMove',
          {x: 1, y: 1},
          {
            category: Fantom.NativeEventCategory.Continuous,
            isUnique: true,
          },
        );
      });

      Fantom.runWorkLoop();

      expect(onPointerMove).toHaveBeenCalledTimes(3);

      expect(onPointerMove.mock.calls[0][0].nativeEvent.x).toBe(0);
      expect(onPointerMove.mock.calls[0][0].nativeEvent.y).toBe(0);

      expect(onPointerMove.mock.calls[1][0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.calls[1][0].nativeEvent.y).toBe(0);

      expect(onPointerMove.mock.calls[2][0].nativeEvent.x).toBe(1);
      expect(onPointerMove.mock.calls[2][0].nativeEvent.y).toBe(1);
    });
  });
});
