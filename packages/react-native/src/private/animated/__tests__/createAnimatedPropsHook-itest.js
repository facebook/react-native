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

import {AnimatedEvent} from '../../../../Libraries/Animated/AnimatedEvent';
import createAnimatedPropsHook from '../createAnimatedPropsHook';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useLayoutEffect} from 'react';

describe('useAnimatedProps', () => {
  it('returns the same ref callback when `props` changes', () => {
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs: Array<mixed> = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const [, ref] = useAnimatedProps(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<Sentinel foo={1} />);
    });
    expect(refs.length).toBe(1);
    expect(typeof refs[0]).toBe('function');

    Fantom.runTask(() => {
      root.render(<Sentinel foo={2} />);
    });
    expect(refs.length).toBe(1);

    Fantom.runTask(() => {
      root.destroy();
    });
    Fantom.runWorkLoop();
  });

  it('returns the same ref callback when `AnimatedEvent` is the same', () => {
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs: Array<mixed> = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const [, ref] = useAnimatedProps(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const event = new AnimatedEvent([{}], {useNativeDriver: true});

    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<Sentinel foo={event} />);
    });
    expect(refs.length).toBe(1);
    expect(typeof refs[0]).toBe('function');

    Fantom.runTask(() => {
      root.render(<Sentinel foo={event} />);
    });
    expect(refs.length).toBe(1);

    Fantom.runTask(() => {
      root.destroy();
    });
    Fantom.runWorkLoop();
  });

  it('returns a new ref callback when `AnimatedEvent` changes', () => {
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs: Array<mixed> = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const [, ref] = useAnimatedProps(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const eventA = new AnimatedEvent([{}], {useNativeDriver: true});
    const eventB = new AnimatedEvent([{}], {useNativeDriver: true});

    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<Sentinel foo={eventA} />);
    });
    expect(refs.length).toBe(1);
    expect(typeof refs[0]).toBe('function');

    Fantom.runTask(() => {
      root.render(<Sentinel foo={eventB} />);
    });
    expect(refs.length).toBe(2);
    expect(typeof refs[1]).toBe('function');
    expect(refs[0]).not.toBe(refs[1]);

    Fantom.runTask(() => {
      root.destroy();
    });
    Fantom.runWorkLoop();
  });
});
