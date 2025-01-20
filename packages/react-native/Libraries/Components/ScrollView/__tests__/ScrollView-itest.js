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
import ensureInstance from '../../../../../react-native/src/private/utilities/ensureInstance';
import ReactNativeElement from '../../../../../react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import View from '../../View/View';
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

    root.destroy();
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

    root.destroy();
  });
});

describe('contentOffset + measure', () => {
  it('delivers onScroll event', () => {
    const root = Fantom.createRoot();
    let maybeScrollViewNode;
    let maybeNode;
    const onScroll = jest.fn();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          onScroll={event => {
            onScroll(event.nativeEvent);
          }}
          ref={node => {
            maybeScrollViewNode = node;
          }}>
          <View
            style={{width: 1, height: 2, top: 3}}
            ref={node => {
              maybeNode = node;
            }}
          />
        </ScrollView>,
      );
    });

    const scrollViewElement = ensureInstance(
      maybeScrollViewNode,
      ReactNativeElement,
    );

    Fantom.runOnUIThread(() => {
      Fantom.dispatchNativeEvent(
        scrollViewElement,
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
      Fantom.dispatchNativeStateUpdate(scrollViewElement, {
        contentOffsetLeft: 0,
        contentOffsetTop: 1,
        scrollAwayPaddingTop: 0,
      });
    });

    Fantom.runWorkLoop();

    expect(onScroll).toHaveBeenCalledTimes(1);

    const viewElement = ensureInstance(maybeNode, ReactNativeElement);

    let rect;

    viewElement.measure((x, y, width, height, pageX, pageY) => {
      rect = {
        x,
        y,
        width,
        height,
        pageX,
        pageY,
      };
    });

    const boundingClientRect = viewElement.getBoundingClientRect();
    expect(boundingClientRect.x).toBe(0);
    expect(boundingClientRect.y).toBe(2);
    expect(boundingClientRect.width).toBe(1);
    expect(boundingClientRect.height).toBe(2);

    expect(rect).toEqual({
      x: 0,
      y: 3,
      width: 1,
      height: 2,
      pageY: 2,
      pageX: 0,
    });

    root.destroy();
  });
});
