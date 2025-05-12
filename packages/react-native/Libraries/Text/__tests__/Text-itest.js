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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Text} from 'react-native';

describe('<Text>', () => {
  describe('props', () => {
    describe('style', () => {
      describe('writingDirection', () => {
        it('propagates to mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'rtl'}}>dummy text</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="rtl">dummy text</rn-paragraph>,
          );

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'ltr'}}>dummy text</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="ltr">dummy text</rn-paragraph>,
          );

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'auto'}}>dummy text</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="auto">dummy text</rn-paragraph>,
          );
        });
      });
    });
  });
});
