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

import '../../../../Libraries/Core/InitializeCore.js';

import View from '../View';
import Fantom from '@react-native/fantom';
import * as React from 'react';

let root;
let thousandViews: React.MixedElement;

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
  );
