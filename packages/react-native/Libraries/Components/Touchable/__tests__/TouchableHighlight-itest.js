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
import {Text, TouchableHighlight, View} from 'react-native';

describe('<TouchableHighlight>', () => {
  describe('rendering', () => {
    it('renders as a view with accessible="true"', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
        <rn-view accessible="true">
          <rn-view />
        </rn-view>,
      );
    });

    it('renders children inside the touchable', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight>
            <Text>Touchable</Text>
          </TouchableHighlight>,
        );
      });

      expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
        <rn-view accessible="true">
          <rn-paragraph>Touchable</rn-paragraph>
        </rn-view>,
      );
    });
  });

  describe('disabled', () => {
    it('sets accessibilityState disabled to true when disabled={true}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight disabled={true}>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}">
          <rn-view />
        </rn-view>,
      );
    });

    it('sets accessibilityState disabled to true when disabled={true} and accessibilityState is empty', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight disabled={true} accessibilityState={{}}>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}">
          <rn-view />
        </rn-view>,
      );
    });

    it('keeps other accessibilityState fields when disabled={true}', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight
            disabled={true}
            accessibilityState={{checked: true}}>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:Checked,busy:false,expanded:null}">
          <rn-view />
        </rn-view>,
      );
    });

    it('overrides accessibilityState disabled=false with disabled prop', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight
            disabled={true}
            accessibilityState={{disabled: false}}>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}">
          <rn-view />
        </rn-view>,
      );
    });

    it('sets accessibilityState disabled when only accessibilityState has disabled=true', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableHighlight accessibilityState={{disabled: true}}>
            <View collapsable={false} />
          </TouchableHighlight>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}">
          <rn-view />
        </rn-view>,
      );
    });
  });
});
