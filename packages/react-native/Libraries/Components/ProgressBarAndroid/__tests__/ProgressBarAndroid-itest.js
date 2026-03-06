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
// $FlowFixMe[missing-platform-support]
import ProgressBarAndroid from '../ProgressBarAndroid.android';

describe('<ProgressBarAndroid>', () => {
  describe('props', () => {
    describe('styleAttr and indeterminate', () => {
      it('renders with styleAttr="Horizontal" and indeterminate={true}', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid styleAttr="Horizontal" indeterminate={true} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });

      it('renders with default props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid styleAttr="Normal" indeterminate={true} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });

      it('renders with styleAttr="Normal"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid styleAttr="Normal" indeterminate={true} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });

      it('renders with styleAttr="Horizontal" and determinate progress', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid
              styleAttr="Horizontal"
              indeterminate={false}
              progress={0.5}
            />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });
    });

    describe('animating', () => {
      it('defaults to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid styleAttr="Horizontal" indeterminate={true} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });

      it('renders when animating is false', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid
              styleAttr="Horizontal"
              indeterminate={true}
              animating={false}
            />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-androidProgressBar />,
        );
      });
    });

    describe('testID', () => {
      it('is propagated to the native component', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <ProgressBarAndroid
              styleAttr="Horizontal"
              indeterminate={true}
              testID="my-progress-bar"
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
          <rn-androidProgressBar testID="my-progress-bar" />,
        );
      });
    });
  });
});
