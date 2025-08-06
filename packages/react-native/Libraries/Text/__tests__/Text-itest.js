/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_flags reduceDefaultPropsInText:*
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Text} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyText from 'react-native/src/private/webapis/dom/nodes/ReadOnlyText';

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

  describe('ref', () => {
    it('is a element node', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<Text ref={elementRef}>Some text</Text>);
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.tagName).toBe('RN:Paragraph');
    });

    it('has a single text child node when not nested', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<Text ref={elementRef}>Some text</Text>);
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.childNodes.length).toBe(1);

      const textChild = ensureInstance(element.childNodes[0], ReadOnlyText);
      expect(textChild.textContent).toBe('Some text');
    });

    it('has text and element child nodes when nested', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <Text ref={elementRef}>
            Some text <Text style={{fontWeight: 'bold'}}>also in bold</Text>
          </Text>,
        );
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.childNodes.length).toBe(2);

      const firstChild = ensureInstance(element.childNodes[0], ReadOnlyText);
      expect(firstChild.textContent).toBe('Some text ');

      const secondChild = ensureInstance(
        element.childNodes[1],
        ReactNativeElement,
      );
      expect(secondChild.tagName).toBe('RN:Text');
      expect(secondChild.childNodes.length).toBe(1);

      const secondChildText = ensureInstance(
        secondChild.childNodes[0],
        ReadOnlyText,
      );
      expect(secondChildText.textContent).toBe('also in bold');
    });
  });
});
