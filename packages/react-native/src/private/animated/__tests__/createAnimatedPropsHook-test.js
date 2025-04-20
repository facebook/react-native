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

import type {ReactNativeFeatureFlagsJsOnlyOverrides} from '../../featureflags/ReactNativeFeatureFlags';

import {create, update} from '../../../../jest/renderer';
import {useLayoutEffect} from 'react';

describe('useAnimatedProps', () => {
  function importModules(overrides: ReactNativeFeatureFlagsJsOnlyOverrides) {
    const ReactNativeFeatureFlags = require('../../featureflags/ReactNativeFeatureFlags');

    // Make sure to setup overrides before importing any modules.
    ReactNativeFeatureFlags.override(overrides);

    return {
      // $FlowIgnore[unsafe-getters-setters]
      get AnimatedEvent() {
        return require('@react-native/animated/AnimatedEvent').AnimatedEvent;
      },
      // $FlowIgnore[unsafe-getters-setters]
      get createAnimatedPropsHook() {
        return require('../createAnimatedPropsHook').default;
      },
    };
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it('returns the same ref callback when `props` changes', async () => {
    const {createAnimatedPropsHook} = importModules({});
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      const [, ref] = useAnimatedProps<{[string]: mixed}, mixed>(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const root = await create(<Sentinel foo={1} />);
    expect(refs.length).toBe(1);
    expect(refs[0]).toBeInstanceOf(Function);

    await update(root, <Sentinel foo={2} />);
    expect(refs.length).toBe(1);
  });

  it('returns the same ref callback when `AnimatedEvent` is the same', async () => {
    const {AnimatedEvent, createAnimatedPropsHook} = importModules({});
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      const [, ref] = useAnimatedProps<{[string]: mixed}, mixed>(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const event = new AnimatedEvent([{}], {useNativeDriver: true});

    const root = await create(<Sentinel foo={event} />);
    expect(refs.length).toBe(1);
    expect(refs[0]).toBeInstanceOf(Function);

    await update(root, <Sentinel foo={event} />);
    expect(refs.length).toBe(1);
  });

  it('returns a new ref callback when `AnimatedEvent` changes', async () => {
    const {AnimatedEvent, createAnimatedPropsHook} = importModules({});
    const useAnimatedProps = createAnimatedPropsHook(null);

    const refs = [];
    function Sentinel(props: {[string]: mixed}): React.Node {
      const [, ref] = useAnimatedProps<{[string]: mixed}, mixed>(props);
      useLayoutEffect(() => {
        refs.push(ref);
      }, [ref]);
      return null;
    }

    const eventA = new AnimatedEvent([{}], {useNativeDriver: true});
    const eventB = new AnimatedEvent([{}], {useNativeDriver: true});

    const root = await create(<Sentinel foo={eventA} />);
    expect(refs.length).toBe(1);
    expect(refs[0]).toBeInstanceOf(Function);

    await update(root, <Sentinel foo={eventB} />);
    expect(refs.length).toBe(2);
    expect(refs[1]).toBeInstanceOf(Function);

    expect(refs[0]).not.toBe(refs[1]);
  });
});
