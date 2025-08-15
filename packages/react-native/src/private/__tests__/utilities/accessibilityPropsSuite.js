/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Root} from '@react-native/fantom';
import type {AccessibilityProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';

export default function accessibilityPropsSuite(
  Component: component(...AccessibilityProps),
  accessibleByDefault: boolean = true,
): void {
  let root: Root;

  function getAccessibilityProp(
    content: React.MixedElement,
    name: $Keys<AccessibilityProps>,
  ) {
    Fantom.runTask(() => {
      root.render(content);
    });
    return root.getRenderedOutput({props: [name]}).toJSONObject().props[name];
  }

  function getAccessibilityProps(
    content: React.MixedElement,
    names: $ReadOnlyArray<$Keys<AccessibilityProps>>,
  ) {
    Fantom.runTask(() => {
      root.render(content);
    });
    const props = root.getRenderedOutput({props: names}).toJSONObject().props;
    return {...props};
  }

  describe('accessibility', () => {
    beforeEach(() => {
      root = Fantom.createRoot();
    });

    afterEach(() => {
      root.destroy();
    });

    describe('accessible', () => {
      accessibleByDefault &&
        it('is accessible by default', () => {
          expect(getAccessibilityProp(<Component />, 'accessible')).toEqual(
            'true',
          );
        });

      !accessibleByDefault &&
        it('is not accessible by default', () => {
          expect(getAccessibilityProp(<Component />, 'accessible')).toEqual(
            undefined,
          );
        });

      it('can be set to accessible', () => {
        expect(
          getAccessibilityProp(<Component accessible={true} />, 'accessible'),
        ).toEqual('true');
      });

      it('can be set to not accessible', () => {
        expect(
          getAccessibilityProp(<Component accessible={false} />, 'accessible'),
        ).toEqual(undefined);
      });
    });

    describe('accessibilityLabel', () => {
      it('can be set', () => {
        expect(
          getAccessibilityProp(
            <Component accessibilityLabel="Touch" />,
            'accessibilityLabel',
          ),
        ).toEqual('Touch');
      });
    });

    describe('accessibilityHint', () => {
      it('can be set to help users understand what will happen when they perform an action', () => {
        expect(
          getAccessibilityProps(
            <Component
              accessibilityLabel="Touchable"
              accessibilityHint="Can be pressed to interact"
            />,
            ['accessibilityLabel', 'accessibilityHint'],
          ),
        ).toEqual({
          accessibilityLabel: 'Touchable',
          accessibilityHint: 'Can be pressed to interact',
        });
      });
    });

    (['role', 'accessibilityRole'] as const).forEach(prop =>
      describe(prop, () => {
        (
          [
            'none',
            'button',
            'link',
            'search',
            'image',
            'keyboardkey',
            'text',
            'adjustable',
            'imagebutton',
            'header',
            'summary',
            'alert',
            'checkbox',
            'combobox',
            'menu',
            'menubar',
            'menuitem',
            'progressbar',
            'radio',
            'radiogroup',
            'scrollbar',
            'spinbutton',
            'switch',
            'tab',
            'tablist',
            'timer',
            'toolbar',
          ] as const
        ).forEach(role => {
          it(`can be set to ${role}`, () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityRole={role} />,
                'accessibilityRole',
              ),
            ).toEqual(role);
          });
        });

        prop === 'accessibilityRole' &&
          it('has higher priority than "role"', () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityRole="button" role="radio" />,
                'accessibilityRole',
              ),
            ).toEqual('button');
          });

        prop === 'role' &&
          it('has lower priority than "accessibilityRole"', () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityRole="button" role="radio" />,
                'accessibilityRole',
              ),
            ).toEqual('button');
          });
      }),
    );

    describe('accessibilityState', () => {
      (['disabled', 'selected', 'busy', 'expanded'] as const).forEach(
        stateProp => {
          it(`can be "${stateProp}"`, () => {
            expect(
              getAccessibilityProp(
                <Component accessibilityState={{[stateProp]: true}} />,
                'accessibilityState',
              ).includes(`${stateProp}:true`),
            ).toEqual(true);
          });
        },
      );

      describe('checked', () => {
        it('can be set to true', () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: true}} />,
              'accessibilityState',
            ).includes(`checked:Checked`),
          ).toEqual(true);
        });

        it('can be set to false', () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: false}} />,
              'accessibilityState',
            ).includes(`checked:Unchecked`),
          ).toEqual(true);
        });

        it("can be set to 'mixed'", () => {
          expect(
            getAccessibilityProp(
              <Component accessibilityState={{checked: 'mixed'}} />,
              'accessibilityState',
            ).includes('checked:Mixed'),
          ).toEqual(true);
        });
      });
    });

    describe('accessibilityActions', () => {
      it('can be set to list of actions', () => {
        expect(
          getAccessibilityProp(
            <Component
              accessibilityActions={[
                {name: 'activate'},
                {name: 'spawn', label: 'open a panel'},
                {name: 'escape'},
              ]}
            />,
            'accessibilityActions',
          ),
        ).toEqual("[activate, spawn: 'open a panel', escape]");
      });
    });
  });
}
