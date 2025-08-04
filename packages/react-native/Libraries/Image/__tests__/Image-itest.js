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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Image} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<Image>', () => {
  describe('props', () => {
    it('renders an empty element when there are no props', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<Image />);
      });

      expect(
        root.getRenderedOutput({includeLayoutMetrics: true}).toJSX(),
      ).toEqual(
        <rn-image
          layoutMetrics-borderWidth="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-contentInsets="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-displayType="Flex"
          layoutMetrics-frame="{x:0,y:0,width:390,height:0}"
          layoutMetrics-layoutDirection="LeftToRight"
          layoutMetrics-overflowInset="{top:0,right:0,bottom:0,left:0}"
          layoutMetrics-pointScaleFactor="3"
          overflow="hidden"
        />,
      );
    });

    describe('accessibility', () => {
      describe('accessible', () => {
        it('indicates that image is an accessibility element', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Image accessible={true} />);
          });

          expect(
            root.getRenderedOutput({props: ['accessible']}).toJSX(),
          ).toEqual(<rn-image accessible="true" />);
        });
      });

      describe('accessibilityLabel', () => {
        it('provides information for screen reader', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Image accessibilityLabel="React Native Logo" />);
          });

          expect(
            root.getRenderedOutput({props: ['accessibilityLabel']}).toJSX(),
          ).toEqual(<rn-image accessibilityLabel="React Native Logo" />);
        });
      });

      describe('alt', () => {
        it('provides information for screen reader', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Image alt="React Native Logo" />);
          });

          expect(root.getRenderedOutput({props: ['^access']}).toJSX()).toEqual(
            <rn-image
              accessible="true"
              accessibilityLabel="React Native Logo"
            />,
          );
        });

        it('can be set alongside accessibilityLabel, but accessibilityLabel has higher priority', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Image
                alt="React Native Logo"
                accessibilityLabel="React Native"
              />,
            );
          });

          expect(root.getRenderedOutput({props: ['^access']}).toJSX()).toEqual(
            <rn-image accessible="true" accessibilityLabel="React Native" />,
          );
        });
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
      });

      it('uses the "RN:Image" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} />);
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:Image');
      });
    });
  });
});
