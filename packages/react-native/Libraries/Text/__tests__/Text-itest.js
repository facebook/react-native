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

import type {Role} from '../../Components/View/ViewAccessibility';
import type {AccessibilityProps, HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Text} from 'react-native';
import accessibilityPropsSuite from 'react-native/src/private/__tests__/utilities/accessibilityPropsSuite';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import ReadOnlyText from 'react-native/src/private/webapis/dom/nodes/ReadOnlyText';

const TEST_TEXT = 'the text';

describe('<Text>', () => {
  describe('props', () => {
    describe('empty props', () => {
      it('renders an empty element when there are no props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-paragraph
            allowFontScaling="true"
            ellipsizeMode="tail"
            fontSize="NaN"
            fontSizeMultiplier="NaN"
            foregroundColor="rgba(0, 0, 0, 0)">
            {TEST_TEXT}
          </rn-paragraph>,
        );
      });
    });

    describe('adjustsFontSizeToFit', () => {
      it(`can be set to "true"`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text adjustsFontSizeToFit={true}>{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['adjustsFontSizeToFit']}).toJSX(),
        ).toEqual(
          <rn-paragraph adjustsFontSizeToFit="true">{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`has 'false' as default`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['adjustsFontSizeToFit']}).toJSX(),
        ).toEqual(<rn-paragraph>{TEST_TEXT}</rn-paragraph>);
      });
    });

    describe('allowFontScaling', () => {
      ([true, false] as const).forEach(propVal => {
        it(`can be set to "${propVal.toString()}"`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Text allowFontScaling={propVal}>{TEST_TEXT}</Text>);
          });

          expect(
            root.getRenderedOutput({props: ['allowFontScaling']}).toJSX(),
          ).toEqual(
            <rn-paragraph allowFontScaling={propVal.toString()}>
              {TEST_TEXT}
            </rn-paragraph>,
          );
        });
      });

      it(`has 'true' as default`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['allowFontScaling']}).toJSX(),
        ).toEqual(
          <rn-paragraph allowFontScaling={'true'}>{TEST_TEXT}</rn-paragraph>,
        );
      });
    });

    describe('ellipsizeMode', () => {
      it(`has 'tail' as default on JS side`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['ellipsizeMode']}).toJSX(),
        ).toEqual(
          <rn-paragraph ellipsizeMode="tail">{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`has 'clip' as default on C++ side`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text ellipsizeMode="clip">{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['ellipsizeMode']}).toJSX(),
        ).toEqual(<rn-paragraph>{TEST_TEXT}</rn-paragraph>);
      });

      (['head', 'middle', 'tail'] as const).forEach(propVal => {
        it(`can be set to "${propVal}"`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Text ellipsizeMode={propVal}>{TEST_TEXT}</Text>);
          });

          expect(
            root.getRenderedOutput({props: ['ellipsizeMode']}).toJSX(),
          ).toEqual(
            <rn-paragraph ellipsizeMode={propVal}>{TEST_TEXT}</rn-paragraph>,
          );
        });
      });
    });

    describe('id and nativeID', () => {
      it(`has 'id' propagated correctly`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text id="alpha">{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-paragraph nativeID={'alpha'}>{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`has 'nativeID' propagated correctly`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text nativeID="alpha">{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
          <rn-paragraph nativeID={'alpha'}>{TEST_TEXT}</rn-paragraph>,
        );
      });
      it(`has a precedence of 'id' over 'nativeID'`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Text id="alpha" nativeID="gamma">
              {TEST_TEXT}
            </Text>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['id', 'nativeID']}).toJSX(),
        ).toEqual(<rn-paragraph nativeID={'alpha'}>{TEST_TEXT}</rn-paragraph>);
      });
    });

    describe('maxFontSizeMultiplier', () => {
      it(`propagates valid numbers correctly`, () => {
        const root = Fantom.createRoot();

        [-1, 0, 1, 3, 1000].forEach(val => {
          Fantom.runTask(() => {
            root.render(<Text maxFontSizeMultiplier={val}>{TEST_TEXT}</Text>);
          });

          expect(
            root.getRenderedOutput({props: ['maxFontSizeMultiplier']}).toJSX(),
          ).toEqual(
            <rn-paragraph maxFontSizeMultiplier={val.toString()}>
              {TEST_TEXT}
            </rn-paragraph>,
          );
        });
      });
    });

    describe('numberOfLines', () => {
      let originalConsoleError = null;

      afterEach(() => {
        if (originalConsoleError != null) {
          // $FlowExpectedError[cannot-write]
          console.error = originalConsoleError;
          originalConsoleError = null;
        }
      });

      it(`doesn't allow negative numbers`, () => {
        originalConsoleError = console.error;
        // $FlowExpectedError[cannot-write]
        console.error = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text numberOfLines={-1}>{TEST_TEXT}</Text>);
        });

        expect(
          // NB. "numberOfLines" is mapped to "maximumNumberOfLines" in C++
          root.getRenderedOutput({props: ['maximumNumberOfLines']}).toJSX(),
        ).toEqual(<rn-paragraph>{TEST_TEXT}</rn-paragraph>);
      });

      it(`has 0 as defult`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text numberOfLines={0}>{TEST_TEXT}</Text>);
        });

        expect(
          root.getRenderedOutput({props: ['maximumNumberOfLines']}).toJSX(),
        ).toEqual(<rn-paragraph>{TEST_TEXT}</rn-paragraph>);
      });

      it(`propagates valid numbers correctly`, () => {
        const root = Fantom.createRoot();

        [3, 1000].forEach(val => {
          Fantom.runTask(() => {
            root.render(<Text numberOfLines={val}>{TEST_TEXT}</Text>);
          });

          expect(
            root.getRenderedOutput({props: ['maximumNumberOfLines']}).toJSX(),
          ).toEqual(
            <rn-paragraph maximumNumberOfLines={val.toString()}>
              {TEST_TEXT}
            </rn-paragraph>,
          );
        });
      });
    });

    describe('role', () => {
      it(`has none by default`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['role']}).toJSX()).toEqual(
          <rn-paragraph>{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`maps invalid values to 'none'`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          // $FlowExpectedError[incompatible-type]
          root.render(<Text role="__some_invalid_value">{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['role']}).toJSX()).toEqual(
          <rn-paragraph role="none">{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`propagates correctly all possible values`, () => {
        const root = Fantom.createRoot();
        (
          [
            'alert',
            'alertdialog',
            'application',
            'article',
            'banner',
            'button',
            'cell',
            'checkbox',
            'columnheader',
            'combobox',
            'complementary',
            'contentinfo',
            'definition',
            'dialog',
            'directory',
            'document',
            'feed',
            'figure',
            'form',
            'grid',
            'group',
            'heading',
            'img',
            'link',
            'list',
            'listitem',
            'log',
            'main',
            'marquee',
            'math',
            'menu',
            'menubar',
            'menuitem',
            'meter',
            'navigation',
            'none',
            'note',
            'option',
            'presentation',
            'progressbar',
            'radio',
            'radiogroup',
            'region',
            'row',
            'rowgroup',
            'rowheader',
            'scrollbar',
            'searchbox',
            'separator',
            'slider',
            'spinbutton',
            'status',
            'summary',
            'switch',
            'tab',
            'table',
            'tablist',
            'tabpanel',
            'term',
            'timer',
            'toolbar',
            'tooltip',
            'tree',
            'treegrid',
            'treeitem',
            'treeitem',
          ] as Array<Role>
        ).forEach(propVal => {
          Fantom.runTask(() => {
            root.render(<Text role={propVal}>{TEST_TEXT}</Text>);
          });

          expect(root.getRenderedOutput({props: ['role']}).toJSX()).toEqual(
            <rn-paragraph role={propVal}>{TEST_TEXT}</rn-paragraph>,
          );
        });
      });
    });

    describe('selectable', () => {
      it(`can be set to "true"`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text selectable={true}>{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['selectable']}).toJSX()).toEqual(
          <rn-paragraph selectable={'true'}>{TEST_TEXT}</rn-paragraph>,
        );
      });

      it(`has 'false' as default`, () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Text>{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['selectable']}).toJSX()).toEqual(
          <rn-paragraph>{TEST_TEXT}</rn-paragraph>,
        );

        Fantom.runTask(() => {
          root.render(<Text selectable={false}>{TEST_TEXT}</Text>);
        });

        expect(root.getRenderedOutput({props: ['selectable']}).toJSX()).toEqual(
          <rn-paragraph>{TEST_TEXT}</rn-paragraph>,
        );
      });
    });

    describe('style', () => {
      describe('writingDirection', () => {
        it('propagates to mounting layer', () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'rtl'}}>{TEST_TEXT}</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="rtl">{TEST_TEXT}</rn-paragraph>,
          );

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'ltr'}}>{TEST_TEXT}</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="ltr">{TEST_TEXT}</rn-paragraph>,
          );

          Fantom.runTask(() => {
            root.render(
              <Text style={{writingDirection: 'auto'}}>{TEST_TEXT}</Text>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['writingDirection']}).toJSX(),
          ).toEqual(
            <rn-paragraph writingDirection="auto">{TEST_TEXT}</rn-paragraph>,
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
        root.render(<Text ref={elementRef}>{TEST_TEXT}</Text>);
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.tagName).toBe('RN:Paragraph');
    });

    it('has a single text child node when not nested', () => {
      const elementRef = createRef<HostInstance>();

      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<Text ref={elementRef}>{TEST_TEXT}</Text>);
      });

      const element = ensureInstance(elementRef.current, ReactNativeElement);
      expect(element.childNodes.length).toBe(1);

      const textChild = ensureInstance(element.childNodes[0], ReadOnlyText);
      expect(textChild.textContent).toBe(TEST_TEXT);
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

  component ComponentWithAccessibilityProps(...props: AccessibilityProps) {
    return <Text {...props}>{TEST_TEXT}</Text>;
  }
  accessibilityPropsSuite(ComponentWithAccessibilityProps, false);
});
