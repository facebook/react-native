/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import '../../../Core/InitializeCore.js';
import ensureInstance from '../../../../src/private/utilities/ensureInstance';
import ReactNativeElement from '../../../../src/private/webapis/dom/nodes/ReactNativeElement';
import ScrollView from '../ScrollView';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('onScroll', () => {
  it('delivers onScroll event', () => {
    const root = Fantom.createRoot();
    let maybeNode;
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(
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
    let maybeNode;
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={node => {
            maybeNode = node;
          }}
        />,
      );
    });

    const element = ensureInstance(maybeNode, ReactNativeElement);

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(element, 'scroll', {
        contentOffset: {
          x: 0,
          y: 1,
        },
      });
      Fantom.dispatchNativeEvent(
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
