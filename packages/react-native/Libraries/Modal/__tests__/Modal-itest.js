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
import {Modal} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

const DEFAULT_MODAL_CHILD_VIEW = (
  <rn-view
    backgroundColor="rgba(255, 255, 255, 1)"
    flex="1.000000"
    left="0.000000"
    top="0.000000"
  />
);

describe('<Modal>', () => {
  describe('props', () => {
    it('renders a Modal with the default values when no props are passed', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(<Modal />);
      });

      expect(root.getRenderedOutput().toJSX()).toEqual(
        <rn-modalHostView positionType="absolute" visible="true">
          {DEFAULT_MODAL_CHILD_VIEW}
        </rn-modalHostView>,
      );
    });
    describe('animationType', () => {
      it('renders a Modal with animationType="none" by default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal animationType="none" />);
        });

        expect(
          root.getRenderedOutput({props: ['animationType']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });

      (['slide', 'fade'] as const).forEach(animationType => {
        it(`renders a Modal with animationType="${animationType}"`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(<Modal animationType={animationType} />);
          });

          expect(
            root.getRenderedOutput({props: ['animationType']}).toJSX(),
          ).toEqual(
            <rn-modalHostView animationType={animationType}>
              <rn-view />
            </rn-modalHostView>,
          );
        });
      });
    });

    describe('presentationStyle', () => {
      it('renders a Modal with presentationStyle="fullScreen" by default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal presentationStyle="fullScreen" />);
        });

        expect(
          root.getRenderedOutput({props: ['presentationStyle']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });

      (['pageSheet', 'formSheet', 'overFullScreen'] as const).forEach(
        presentationStyle => {
          it(`renders a Modal with presentationStyle="${presentationStyle}"`, () => {
            const root = Fantom.createRoot();

            Fantom.runTask(() => {
              root.render(<Modal presentationStyle={presentationStyle} />);
            });

            expect(
              root.getRenderedOutput({props: ['presentationStyle']}).toJSX(),
            ).toEqual(
              <rn-modalHostView presentationStyle={presentationStyle}>
                <rn-view />
              </rn-modalHostView>,
            );
          });
        },
      );
    });
    describe('transparent', () => {
      it('renders a Modal with transparent="true"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal transparent={true} />);
        });

        expect(
          root
            .getRenderedOutput({props: ['transparent', 'presentationStyle']})
            .toJSX(),
        ).toEqual(
          <rn-modalHostView
            transparent="true"
            presentationStyle="overFullScreen">
            <rn-view />
          </rn-modalHostView>,
        );
      });

      it('renders a Modal with transparent="false"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal transparent={false} />);
        });

        expect(
          root
            .getRenderedOutput({props: ['transparent', 'presentationStyle']})
            .toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });
    describe('statusBarTranslucent', () => {
      it('renders a Modal with statusBarTranslucent="true"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal statusBarTranslucent={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['statusBarTranslucent']}).toJSX(),
        ).toEqual(
          <rn-modalHostView statusBarTranslucent="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with statusBarTranslucent="false"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal statusBarTranslucent={false} />);
        });

        expect(
          root.getRenderedOutput({props: ['statusBarTranslucent']}).toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });
    describe('navigationBarTranslucent', () => {
      it('renders a Modal with navigationBarTranslucent="true" and statusBarTranslucent="true"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          // navigationBarTranslucent=true with statusBarTranslucent=false is not supported
          // and it emits a warning.
          root.render(
            <Modal
              navigationBarTranslucent={true}
              statusBarTranslucent={true}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['navigationBarTranslucent', 'statusBarTranslucent'],
            })
            .toJSX(),
        ).toEqual(
          <rn-modalHostView
            navigationBarTranslucent="true"
            statusBarTranslucent="true">
            <rn-view />
          </rn-modalHostView>,
        );
      });
      it('renders a Modal with navigationBarTranslucent="false"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Modal navigationBarTranslucent={false} />);
        });

        expect(
          root
            .getRenderedOutput({
              props: ['navigationBarTranslucent', 'statusBarTranslucent'],
            })
            .toJSX(),
        ).toEqual(
          <rn-modalHostView>
            <rn-view />
          </rn-modalHostView>,
        );
      });
    });
    // ... more props
  });
  describe('ref', () => {
    describe('exampleMethod()', () => {
      // more describe('<context>') or tests with it('<behaviour>')
    });
    // ... more methods
    describe('instance', () => {
      it('uses the "RN:ModalHostView" tag name', () => {
        const elementRef = createRef<HostInstance>();
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<Modal ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:ModalHostView');
      });
    });
  });
});
