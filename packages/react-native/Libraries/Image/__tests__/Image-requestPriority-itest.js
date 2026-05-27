/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableImageRequestDowngradingForNonVisibleImages:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {RootConfig} from '@react-native/fantom';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Image, ScrollView, View} from 'react-native';
import NativeFantom from 'react-native/src/private/testing/fantom/specs/NativeFantom';

const IMAGE_SOURCE = {uri: 'https://reactnative.dev/img/tiny_logo.png'};
const UPDATED_IMAGE_SOURCE = {
  uri: 'https://reactnative.dev/img/header_logo.svg',
};

type ImageRequestPriority = 'immediate' | 'prefetch';

function expectLatestImageRequestPriority(
  element: React.MixedElement,
  expectedPriority: ImageRequestPriority,
  rootConfig?: RootConfig,
) {
  const root = Fantom.createRoot({
    viewportWidth: 100,
    viewportHeight: 100,
    ...rootConfig,
  });

  Fantom.runTask(() => {
    root.render(element);
  });

  expect(NativeFantom.getImageRequestCount(IMAGE_SOURCE.uri)).toBe(1);
  expect(NativeFantom.getImageRequestPriority(IMAGE_SOURCE.uri)).toBe(
    expectedPriority,
  );
}

describe('<Image> request priority', () => {
  beforeEach(() => {
    NativeFantom.clearImageRequests();
  });

  afterEach(() => {
    NativeFantom.clearImageRequests();
  });

  it('requests visible images at immediate priority', () => {
    expectLatestImageRequestPriority(
      <Image source={IMAGE_SOURCE} style={{height: 50, width: 50}} />,
      'immediate',
    );
  });

  it('requests images below the viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: 150,
          width: 50,
        }}
      />,
      'prefetch',
    );
  });

  it('requests images above the viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: -51,
          width: 50,
        }}
      />,
      'prefetch',
    );
  });

  it('requests images left of the viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: -51,
          position: 'absolute',
          top: 0,
          width: 50,
        }}
      />,
      'prefetch',
    );
  });

  it('requests images right of the viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 101,
          position: 'absolute',
          top: 0,
          width: 50,
        }}
      />,
      'prefetch',
    );
  });

  it('requests edge-touching images at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: 100,
          width: 50,
        }}
      />,
      'prefetch',
    );
  });

  it('requests one-pixel-overlapping images at immediate priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: 99,
          width: 50,
        }}
      />,
      'immediate',
    );
  });

  it('uses nested layout offsets when calculating priority', () => {
    expectLatestImageRequestPriority(
      <View style={{marginTop: 125}}>
        <Image source={IMAGE_SOURCE} style={{height: 50, width: 50}} />
      </View>,
      'prefetch',
    );
  });

  it('uses viewport offsets when calculating priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: -51,
          width: 50,
        }}
      />,
      'prefetch',
      {
        viewportOffsetY: 25,
      },
    );
  });

  it('uses ScrollView content offsets when calculating priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView
        contentOffset={{x: 0, y: 100}}
        style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginTop: 125, width: 50}}
        />
      </ScrollView>,
      'immediate',
    );
  });

  it('requests images above the ScrollView viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView
        contentOffset={{x: 0, y: 100}}
        style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginTop: 25, width: 50}}
        />
      </ScrollView>,
      'prefetch',
    );
  });

  it('requests images below the ScrollView viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginTop: 150, width: 50}}
        />
      </ScrollView>,
      'prefetch',
    );
  });

  it('uses smaller ScrollView content offsets when calculating priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView
        contentOffset={{x: 0, y: 50}}
        style={{height: 50, marginTop: 25, width: 50}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 10, marginTop: 60, width: 10}}
        />
      </ScrollView>,
      'immediate',
    );
  });

  it('uses horizontal ScrollView content offsets when calculating priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView
        contentOffset={{x: 100, y: 0}}
        horizontal={true}
        style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginLeft: 125, width: 50}}
        />
      </ScrollView>,
      'immediate',
    );
  });

  it('requests images left of a horizontal ScrollView viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView
        contentOffset={{x: 100, y: 0}}
        horizontal={true}
        style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginLeft: 25, width: 50}}
        />
      </ScrollView>,
      'prefetch',
    );
  });

  it('requests images right of a horizontal ScrollView viewport at prefetch priority', () => {
    expectLatestImageRequestPriority(
      <ScrollView horizontal={true} style={{height: 100, width: 100}}>
        <Image
          source={IMAGE_SOURCE}
          style={{height: 50, marginLeft: 150, width: 50}}
        />
      </ScrollView>,
      'prefetch',
    );
  });

  it('uses image transforms when calculating priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 50,
          left: 0,
          position: 'absolute',
          top: 125,
          transform: [{translateY: -50}],
          width: 50,
        }}
      />,
      'immediate',
    );
  });

  it('uses image transforms that move images out of the viewport when calculating priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 10,
          left: 0,
          position: 'absolute',
          top: 90,
          transform: [{translateY: 11}],
          width: 10,
        }}
      />,
      'prefetch',
    );
  });

  it('uses image scale transforms when calculating priority', () => {
    expectLatestImageRequestPriority(
      <Image
        source={IMAGE_SOURCE}
        style={{
          height: 10,
          left: 0,
          position: 'absolute',
          top: 101,
          transform: [{scale: 4}],
          width: 10,
        }}
      />,
      'immediate',
    );
  });

  it('uses ancestor transforms when calculating priority', () => {
    expectLatestImageRequestPriority(
      <View style={{transform: [{translateY: -50}]}}>
        <Image
          source={IMAGE_SOURCE}
          style={{
            height: 50,
            left: 0,
            position: 'absolute',
            top: 125,
            width: 50,
          }}
        />
      </View>,
      'immediate',
    );
  });

  it('uses ancestor transforms that move images out of the viewport when calculating priority', () => {
    expectLatestImageRequestPriority(
      <View style={{transform: [{translateY: 11}]}}>
        <Image
          source={IMAGE_SOURCE}
          style={{
            height: 10,
            left: 0,
            position: 'absolute',
            top: 90,
            width: 10,
          }}
        />
      </View>,
      'prefetch',
    );
  });

  it('updates priority when layout moves an image onscreen', () => {
    const root = Fantom.createRoot({
      viewportWidth: 100,
      viewportHeight: 100,
    });

    Fantom.runTask(() => {
      root.render(
        <Image
          source={IMAGE_SOURCE}
          style={{
            height: 50,
            left: 0,
            position: 'absolute',
            top: 150,
            width: 50,
          }}
        />,
      );
    });

    expect(NativeFantom.getImageRequestCount(IMAGE_SOURCE.uri)).toBe(1);
    expect(NativeFantom.getImageRequestPriority(IMAGE_SOURCE.uri)).toBe(
      'prefetch',
    );

    Fantom.runTask(() => {
      root.render(
        <Image
          source={IMAGE_SOURCE}
          style={{
            height: 50,
            left: 0,
            position: 'absolute',
            top: 25,
            width: 50,
          }}
        />,
      );
    });

    expect(NativeFantom.getImageRequestCount(IMAGE_SOURCE.uri)).toBe(2);
    expect(NativeFantom.getImageRequestPriority(IMAGE_SOURCE.uri)).toBe(
      'immediate',
    );
  });

  it('keeps offscreen priority when the source changes without a layout change', () => {
    const root = Fantom.createRoot({
      viewportWidth: 100,
      viewportHeight: 100,
    });

    const offscreenStyle = {
      height: 50,
      left: 0,
      position: 'absolute',
      top: 150,
      width: 50,
    } as const;

    Fantom.runTask(() => {
      root.render(<Image source={IMAGE_SOURCE} style={offscreenStyle} />);
    });

    expect(NativeFantom.getImageRequestCount(IMAGE_SOURCE.uri)).toBe(1);
    expect(NativeFantom.getImageRequestPriority(IMAGE_SOURCE.uri)).toBe(
      'prefetch',
    );

    NativeFantom.clearImageRequests();

    Fantom.runTask(() => {
      root.render(
        <Image source={UPDATED_IMAGE_SOURCE} style={offscreenStyle} />,
      );
    });

    expect(NativeFantom.getImageRequestCount(UPDATED_IMAGE_SOURCE.uri)).toBe(1);
    expect(NativeFantom.getImageRequestPriority(UPDATED_IMAGE_SOURCE.uri)).toBe(
      'prefetch',
    );
  });
});
