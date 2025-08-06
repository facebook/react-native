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
    describe('empty props', () => {
      // TODO T233552213: do not send empty source
      it('renders an empty element when there are no props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-image overflow="hidden" source-scale="1" source-type="remote" />,
        );

        Fantom.runTask(() => {
          root.render(<Image src="" />);
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-image overflow="hidden" source-scale="1" source-type="remote" />,
        );
      });
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

    describe('blurRadius', () => {
      it('provides blur radius for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image blurRadius={10} />);
        });

        expect(root.getRenderedOutput({props: ['blurRadius']}).toJSX()).toEqual(
          <rn-image blurRadius="10" />,
        );
      });
    });

    describe('crossOrigin', () => {
      it('does not set any headers in anonymous mode', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri={LOGO_SOURCE.uri}
          />,
        );

        Fantom.runTask(() => {
          root.render(<Image crossOrigin="anonymous" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri={LOGO_SOURCE.uri}
          />,
        );
      });

      it('sets the "Access-Control-Allow-Credentials" header in "use-credentials" mode', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image crossOrigin="use-credentials" source={LOGO_SOURCE} />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['source-header']}).toJSX(),
        ).toEqual(
          <rn-image source-header-Access-Control-Allow-Credentials="true" />,
        );
      });
    });

    describe('defaultSource', () => {
      it('can provide a default image to display', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              defaultSource={require('./img/img1.png')}
              source={LOGO_SOURCE}
            />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['defaultSource']}).toJSX(),
        ).toEqual(
          <rn-image
            defaultSource-type="remote"
            defaultSource-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png"
          />,
        );
      });
    });

    describe('height', () => {
      it('provides height for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image height={100} source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
          <rn-image height="100.000000" />,
        );
      });
    });

    describe('loading progress', () => {
      (
        [
          ['onError', 'fails to load'],
          ['onLoadStart', 'start loading'],
          ['onProgress', 'is loading'],
          ['onLoad', 'loads successfully'],
          ['onLoadEnd', 'ends loading'],
        ] as const
      ).forEach(([onProp, event]) => {
        it(`${onProp} is called when image ${event}`, () => {
          const onPropCallback = jest.fn();
          const ref = createRef<HostInstance>();

          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Image
                ref={ref}
                source={LOGO_SOURCE}
                onError={() => {
                  onProp === 'onError' && onPropCallback();
                }}
                onLoad={() => {
                  onProp === 'onLoad' && onPropCallback();
                }}
                onLoadStart={() => {
                  onProp === 'onLoadStart' && onPropCallback();
                }}
                onLoadEnd={() => {
                  onProp === 'onLoadEnd' && onPropCallback();
                }}
                onProgress={() => {
                  onProp === 'onProgress' && onPropCallback();
                }}
              />,
            );
          });

          expect(onPropCallback).toHaveBeenCalledTimes(0);

          const image = ensureInstance(ref.current, ReactNativeElement);
          Fantom.dispatchNativeEvent(image, onProp, {});

          expect(onPropCallback).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('referrerPolicy', () => {
      (
        [
          'no-referrer',
          'no-referrer-when-downgrade',
          'origin',
          'origin-when-cross-origin',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin',
          'unsafe-url',
        ] as const
      ).forEach(referrerPolicy => {
        it(`${referrerPolicy} sets correct "Referrer-Policy" header`, () => {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <Image referrerPolicy={referrerPolicy} src={LOGO_SOURCE.uri} />,
            );
          });

          expect(
            root.getRenderedOutput({props: ['source-header']}).toJSX(),
          ).toEqual(
            <rn-image source-header-Referrer-Policy={referrerPolicy} />,
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
