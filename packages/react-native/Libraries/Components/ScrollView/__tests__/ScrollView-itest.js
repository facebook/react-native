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

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {ScrollView} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('onScroll', () => {
  it('delivers onScroll event', () => {
    const root = Fantom.createRoot();
    const scrollViewRef = createRef<HostInstance>();
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={scrollViewRef}
        />,
      );
    });

    const element = ensureInstance(scrollViewRef.current, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(
        element,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 1,
          },
        },
        {
          isUnique: true,
        },
      );
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);
    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({
      x: 0,
      y: 1,
    });
  });

  it('batches onScroll event per UI tick', () => {
    const root = Fantom.createRoot();
    const scrollViewRef = createRef<HostInstance>();
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={scrollViewRef}
        />,
      );
    });

    const element = ensureInstance(scrollViewRef.current, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.enqueueNativeEvent(
        element,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 1,
          },
        },
        {
          isUnique: true,
        },
      );
      Fantom.enqueueNativeEvent(
        element,
        'scroll',
        {
          contentOffset: {
            x: 0,
            y: 2,
          },
        },
        {
          isUnique: true,
        },
      );
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);
    const [entry] = onScroll.mock.lastCall;
    expect(entry.contentOffset).toEqual({
      x: 0,
      y: 2,
    });
  });
});
