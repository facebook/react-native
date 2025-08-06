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

    describe('width', () => {
      it('provides width for image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image width={100} source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
          <rn-image width="100.000000" />,
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

    describe('resizeMode', () => {
      it('is set to "cover" by default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['resizeMode']}).toJSX()).toEqual(
          <rn-image />,
        );

        Fantom.runTask(() => {
          root.render(<Image resizeMode="cover" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['resizeMode']}).toJSX()).toEqual(
          <rn-image />,
        );
      });

      (['stretch', 'contain', 'repeat', 'center'] as const).forEach(
        resizeMode => {
          it(`can be set to "${resizeMode}"`, () => {
            const root = Fantom.createRoot();

            Fantom.runTask(() => {
              root.render(
                <Image resizeMode={resizeMode} source={LOGO_SOURCE} />,
              );
            });

            expect(
              root.getRenderedOutput({props: ['resizeMode']}).toJSX(),
            ).toEqual(<rn-image resizeMode={resizeMode} />);
          });
        },
      );
    });

    describe('source', () => {
      it('can be set to a local image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image source={require('./img/img1.png')} />);
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-size="{1, 1}"
            source-type="local"
            source-uri="file://drawable-mdpi/packages_reactnative_libraries_image___tests___img_img1.png"
          />,
        );
      });

      it('can be set to a remote image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              source={{
                uri: 'https://reactnative.dev/img/tiny_logo.png',
                width: 100,
                height: 100,
                scale: 2,
                cache: 'only-if-cached',
                method: 'POST',
                body: 'name=React+Native',
                headers: {
                  Authorization: 'Basic RandomString',
                },
              }}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-body="name=React+Native"
            source-cache="only-if-cached"
            source-header-Authorization="Basic RandomString"
            source-method="POST"
            source-scale="2"
            source-size="{100, 100}"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });

      it('can be set to a list of remote images', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              source={[
                {
                  uri: 'https://reactnative.dev/img/tiny_logo.png',
                  scale: 1,
                  headers: {
                    Authorization: 'Basic RandomString',
                  },
                },
                {
                  uri: 'https://reactnative.dev/img/medium_logo.png',
                  scale: 2,
                  cache: 'only-if-cached',
                },
                {
                  uri: 'https://reactnative.dev/img/large_logo.png',
                  scale: 3,
                  method: 'POST',
                },
              ]}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-header-Authorization="Basic RandomString"
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-cache="only-if-cached"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/medium_logo.png"
            source-3x-method="POST"
            source-3x-type="remote"
            source-3x-uri="https://reactnative.dev/img/large_logo.png"
          />,
        );
      });
    });

    describe('src', () => {
      it('can be set to a remote image', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image src="https://reactnative.dev/img/tiny_logo.png" />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });

      it('takes precedence over `source` prop', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              src="https://reactnative.dev/img/tiny_logo.png"
              source={{uri: 'https://reactnative.dev/img/medium_logo.png'}}
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-scale="1"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });
    });

    describe('srcSet', () => {
      it('can be set to a list of remote images', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/tiny_logo.png 1x, https://reactnative.dev/img/header_logo.svg 2x'
              }
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/header_logo.svg"
          />,
        );
      });

      it('defaults to `1x` descriptor', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/tiny_logo.png, https://reactnative.dev/img/header_logo.svg 2x'
              }
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/header_logo.svg"
          />,
        );
      });

      it('uses `src` for `1x` descriptor when provided', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              srcSet={
                'https://reactnative.dev/img/header_logo.svg 2x, https://reactnative.dev/img/large_logo.svg 3x'
              }
              src="https://reactnative.dev/img/tiny_logo.png"
            />,
          );
        });

        expect(root.getRenderedOutput({props: ['source']}).toJSX()).toEqual(
          <rn-image
            source-1x-scale="1"
            source-1x-type="remote"
            source-1x-uri="https://reactnative.dev/img/tiny_logo.png"
            source-2x-scale="2"
            source-2x-type="remote"
            source-2x-uri="https://reactnative.dev/img/header_logo.svg"
            source-3x-type="remote"
            source-3x-uri="https://reactnative.dev/img/large_logo.svg"
          />,
        );
      });
    });

    describe('style', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Image
              style={{
                width: 100,
                height: 100,
                resizeMode: 'contain',
              }}
              source={LOGO_SOURCE}
            />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-image
            height="100.000000"
            overflow="hidden"
            resizeMode="contain"
            width="100.000000"
            source-scale="1"
            source-type="remote"
            source-uri="https://reactnative.dev/img/tiny_logo.png"
          />,
        );
      });
    });

    describe('testID', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image testID="test" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
          <rn-image testID="test" />,
        );
      });
    });

    describe('tintColor', () => {
      it('can be set', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Image tintColor="red" source={LOGO_SOURCE} />);
        });

        expect(root.getRenderedOutput({props: ['tintColor']}).toJSX()).toEqual(
          <rn-image tintColor="rgba(255, 0, 0, 1)" />,
        );
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
