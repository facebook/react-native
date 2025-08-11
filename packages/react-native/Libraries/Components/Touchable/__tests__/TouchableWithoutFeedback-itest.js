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
import {Text, TouchableWithoutFeedback, View} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<TouchableWithoutFeedback>', () => {
  describe('props', () => {
    describe('empty props', () => {
      it('renders without any props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <Text>Touchable</Text>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['isPressable']}).toJSX(),
        ).toEqual(<rn-paragraph isPressable="true">Touchable</rn-paragraph>);
      });
    });

    describe('accessibility', () => {
      it('is accessible by default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <Text>Touchable</Text>
            </TouchableWithoutFeedback>,
          );
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-paragraph accessible="true">Touchable</rn-paragraph>,
        );
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is backed by its child', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <Text>Touchable</Text>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          ensureInstance(
            root.document.documentElement.firstElementChild,
            ReactNativeElement,
          ).tagName,
        ).toBe('RN:Paragraph');

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <View>
                <Text>Touchable</Text>
              </View>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          ensureInstance(
            root.document.documentElement.firstElementChild,
            ReactNativeElement,
          ).tagName,
        ).toBe('RN:View');
      });
    });
  });
});
