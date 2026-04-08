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
import {Text, TouchableNativeFeedback, View} from 'react-native';

describe('<TouchableNativeFeedback>', () => {
  describe('displayName', () => {
    it('has displayName set to TouchableNativeFeedback', () => {
      expect(TouchableNativeFeedback.displayName).toEqual(
        'TouchableNativeFeedback',
      );
    });
  });

  describe('rendering', () => {
    it('renders as a view with accessible="true"', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
        <rn-view accessible="true" />,
      );
    });

    it('renders with children', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback>
            <View>
              <Text>Touchable</Text>
            </View>
          </TouchableNativeFeedback>,
        );
      });

      expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
        <rn-view accessible="true">
          <rn-paragraph>Touchable</rn-paragraph>
        </rn-view>,
      );
    });
  });

  describe('disabled prop', () => {
    it('sets accessibilityState disabled to true when disabled={true}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback disabled={true}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('sets accessibilityState disabled to true even when accessibilityState is empty', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback disabled={true} accessibilityState={{}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('keeps other accessibilityState values when disabled={true}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={true}
            accessibilityState={{checked: true}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:Checked,busy:false,expanded:null}" />,
      );
    });

    it('overwrites accessibilityState disabled=false when disabled={true}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={true}
            accessibilityState={{disabled: false}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('overwrites accessibilityState disabled=true when disabled={false}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={false}
            accessibilityState={{disabled: true}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });
  });
});
