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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root;
let thousandViews: React.MixedElement;
function createViewsWithLargeAmountOfPropsAndStyles(count: number): React.Node {
  let views: React.Node = null;
  for (let i = 0; i < count; i++) {
    views = (
      <View
        accessibilityLabelledBy={'test ${i}'}
        accessibilityLiveRegion={'polite'}
        aria-labelledby={'test ${i}'}
        aria-live={'polite'}
        collapsable={false}
        focusable={i % 2 === 0}
        hasTVPreferredFocus={i % 2 === 0}
        id={String(i)}
        importantForAccessibility={'no-hide-descendants'}
        nativeID={String(i)}
        nextFocusDown={i}
        nextFocusForward={i + 1}
        nextFocusLeft={i + 2}
        nextFocusRight={i + 3}
        nextFocusUp={i + 4}
        renderToHardwareTextureAndroid={true}
        style={{
          width: i + 1,
          height: i + 1,
          backgroundColor: 'blue',
          borderCurve: 'circular',
          borderBottomWidth: i % 2 === 0 ? 0 : 1,
          borderWidth: i % 2 === 0 ? 0 : 1,
          borderEndWidth: i % 2 === 0 ? 0 : 1,
          borderLeftWidth: i % 2 === 0 ? 0 : 1,
          borderRightWidth: i % 2 === 0 ? 0 : 1,
          borderStartWidth: i % 2 === 0 ? 0 : 1,
          borderTopWidth: i % 2 === 0 ? 0 : 1,
          borderBottomColor: i % 2 === 0 ? 'blue' : 'red',
          borderEndColor: i % 2 === 0 ? 'blue' : 'red',
          borderStartColor: i % 2 === 0 ? 'blue' : 'red',
          borderTopColor: i % 2 === 0 ? 'blue' : 'red',
          borderRightColor: i % 2 === 0 ? 'blue' : 'red',
          borderLeftColor: i % 2 === 0 ? 'blue' : 'red',
          opacity: i % 2 === 0 ? 0 : 1,
          elevation: i % 2 === 0 ? 0 : 1,
          pointerEvents: 'auto',
          boxShadow: '0 0 0 1px blue',
          isolation: 'isolate',
          cursor: 'pointer',
          backfaceVisibility: 'visible',
          mixBlendMode: 'multiply',
        }}
        tabIndex={i % 2 === 0 ? 0 : undefined}>
        {views}
      </View>
    );
  }
  return views;
}

Fantom.unstable_benchmark
  .suite('View')
  .test(
    'render 100 uncollapsable views',
    () => {
      Fantom.runTask(() => root.render(thousandViews));
    },
    {
      beforeAll: () => {
        let views: React.Node = null;
        for (let i = 0; i < 100; i++) {
          views = (
            <View
              collapsable={false}
              id={String(i)}
              nativeID={String(i)}
              style={{width: i + 1, height: i + 1}}>
              {views}
            </View>
          );
        }
        // $FlowExpectedError[incompatible-type]
        thousandViews = views;
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  )
  .test(
    'render 1000 uncollapsable views',
    () => {
      Fantom.runTask(() => root.render(thousandViews));
    },
    {
      beforeAll: () => {
        let views: React.Node = null;
        for (let i = 0; i < 1000; i++) {
          views = (
            <View
              collapsable={false}
              id={String(i)}
              nativeID={String(i)}
              style={{width: i + 1, height: i + 1}}>
              {views}
            </View>
          );
        }
        // $FlowExpectedError[incompatible-type]
        thousandViews = views;
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  )
  .test(
    'render 100 views with large amount of props and styles',
    () => {
      Fantom.runTask(() => root.render(thousandViews));
    },
    {
      beforeAll: () => {
        // $FlowExpectedError[incompatible-type]
        thousandViews = createViewsWithLargeAmountOfPropsAndStyles(100);
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  )
  .test(
    'render 1000 views with large amount of props and styles',
    () => {
      Fantom.runTask(() => root.render(thousandViews));
    },
    {
      beforeAll: () => {
        // $FlowExpectedError[incompatible-type]
        thousandViews = createViewsWithLargeAmountOfPropsAndStyles(1000);
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  )
  .test(
    'render 1500 views with large amount of props and styles',
    () => {
      Fantom.runTask(() => root.render(thousandViews));
    },
    {
      beforeAll: () => {
        // $FlowExpectedError[incompatible-type]
        thousandViews = createViewsWithLargeAmountOfPropsAndStyles(1500);
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    },
  );
