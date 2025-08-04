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

const LOGO_SOURCE = {uri: 'https://reactnative.dev/img/tiny_logo.png'};

describe('<Image>', () => {
  describe('props', () => {
    describe('accessibility', () => {
      describe('accessible', () => {
        it('indicates that image is an accessibility element', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Image accessible={true} source={LOGO_SOURCE} />);
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
            root.render(
              <Image
                accessibilityLabel="React Native Logo"
                source={LOGO_SOURCE}
              />,
            );
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
            root.render(<Image alt="React Native Logo" source={LOGO_SOURCE} />);
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
                source={LOGO_SOURCE}
              />,
            );
          });

          expect(root.getRenderedOutput({props: ['^access']}).toJSX()).toEqual(
            <rn-image accessible="true" accessibilityLabel="React Native" />,
          );
        });
      });
    });

    describe('blurRadius', () => {
      it('provides blur radius for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image blurRadius={10} source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['blurRadius']}).toJSX()).toEqual(
          <rn-image blurRadius="10" />,
        );
      });
    });

    describe('src', () => {
      let originalConsoleWarn;
      beforeEach(() => {
        originalConsoleWarn = console.warn;
        // $FlowExpectedError[cannot-write]
        console.warn = jest.fn();
      });

      afterEach(() => {
        // $FlowExpectedError[cannot-write]
        console.warn = originalConsoleWarn;
      });

      it('should warn if no source is provided', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image />);
        });

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('source should not be empty');
      });

      it('should warn if src is empty', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image src="" />);
        });

        expect(console.warn).toHaveBeenCalledTimes(1);
        expect(console.warn).toHaveBeenCalledWith('source should not be empty');
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} source={LOGO_SOURCE} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
      });

      it('uses the "RN:Image" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image ref={elementRef} source={LOGO_SOURCE} />);
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:Image');
      });
    });
  });
});
