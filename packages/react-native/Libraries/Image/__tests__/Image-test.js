/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

import type {ElementRef} from 'react';

import NativeImageLoaderAndroid from '../NativeImageLoaderAndroid';
import NativeImageLoaderIOS from '../NativeImageLoaderIOS';
import {act, create} from 'react-test-renderer';

const render = require('../../../jest/renderer');
const Image = require('../Image');
const ImageInjection = require('../ImageInjection');
const React = require('react');

describe('Image', () => {
  it('should render as <Image> when mocked', async () => {
    const instance = await render.create(
      <Image source={{uri: 'foo-bar.jpg'}} />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should render as <RCTImageView> when not mocked', async () => {
    jest.dontMock('../Image');

    const instance = await render.create(
      <Image source={{uri: 'foo-bar.jpg'}} />,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should invoke original ref callbacks correctly when using image attached callbacks', () => {
    jest.dontMock('../Image');

    let imageInstanceFromCallback = null;
    let imageInstanceFromRef1 = null;
    let imageInstanceFromRef2 = null;

    const callback = jest.fn((instance: ElementRef<typeof Image>) => {
      imageInstanceFromCallback = instance;

      return () => {
        imageInstanceFromCallback = null;
      };
    });

    ImageInjection.unstable_registerImageAttachedCallback(callback);

    expect(imageInstanceFromCallback).toBe(null);

    let testRenderer;

    const ref1 = jest.fn(instance => {
      imageInstanceFromRef1 = instance;
    });

    act(() => {
      testRenderer = create(<Image source={{uri: 'foo-bar.jpg'}} ref={ref1} />);
    });

    expect(imageInstanceFromCallback).not.toBe(null);
    expect(imageInstanceFromRef1).not.toBe(null);
    expect(imageInstanceFromCallback).toBe(imageInstanceFromRef1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(ref1).toHaveBeenCalledTimes(1);

    const ref2 = jest.fn(
      (instance: React.ElementRef<typeof Image> | null): void => {
        imageInstanceFromRef2 = instance;
      },
    );

    act(() => {
      testRenderer.update(<Image source={{uri: 'foo-bar.jpg'}} ref={ref2} />);
    });

    expect(imageInstanceFromCallback).not.toBe(null);
    expect(imageInstanceFromRef1).toBe(null);
    expect(imageInstanceFromRef2).not.toBe(null);
    expect(imageInstanceFromCallback).toBe(imageInstanceFromRef2);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(ref1).toHaveBeenCalledTimes(2);
    expect(ref2).toHaveBeenCalledTimes(1);

    act(() => {
      testRenderer.update(<Image source={{uri: 'foo-bar.jpg'}} ref={ref2} />);
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(ref2).toHaveBeenCalledTimes(1);
  });

  it('should call image attached callbacks (basic)', () => {
    jest.dontMock('../Image');

    let imageInstanceFromCallback = null;
    let imageInstanceFromRef = null;

    const callback = (instance: ElementRef<typeof Image>) => {
      imageInstanceFromCallback = instance;

      return () => {
        imageInstanceFromCallback = null;
      };
    };

    ImageInjection.unstable_registerImageAttachedCallback(callback);

    expect(imageInstanceFromCallback).toBe(null);

    let testRenderer;

    act(() => {
      testRenderer = create(
        <Image
          source={{uri: 'foo-bar.jpg'}}
          ref={instance => {
            imageInstanceFromRef = instance;
          }}
        />,
      );
    });

    expect(imageInstanceFromCallback).not.toBe(null);
    expect(imageInstanceFromRef).not.toBe(null);
    expect(imageInstanceFromCallback).toBe(imageInstanceFromRef);

    act(() => {
      testRenderer.update(<></>);
    });

    expect(imageInstanceFromCallback).toBe(null);
    expect(imageInstanceFromRef).toBe(null);

    ImageInjection.unstable_unregisterImageAttachedCallback(callback);

    act(() => {
      testRenderer.update(
        <Image
          source={{uri: 'foo-bar.jpg'}}
          ref={instance => {
            imageInstanceFromRef = instance;
          }}
        />,
      );
    });

    expect(imageInstanceFromRef).not.toBe(null);
    expect(imageInstanceFromCallback).toBe(null);
  });

  it('should call image attached callbacks (multiple callbacks)', () => {
    jest.dontMock('../Image');

    let imageInstanceFromCallback1 = null;
    let imageInstanceFromCallback2 = null;
    let imageInstanceFromRef = null;

    ImageInjection.unstable_registerImageAttachedCallback(instance => {
      imageInstanceFromCallback1 = instance;

      return () => {
        imageInstanceFromCallback1 = null;
      };
    });

    ImageInjection.unstable_registerImageAttachedCallback(instance => {
      imageInstanceFromCallback2 = instance;

      return () => {
        imageInstanceFromCallback2 = null;
      };
    });

    expect(imageInstanceFromCallback1).toBe(null);
    expect(imageInstanceFromCallback2).toBe(null);

    let testRenderer;

    act(() => {
      testRenderer = create(
        <Image
          source={{uri: 'foo-bar.jpg'}}
          ref={instance => {
            imageInstanceFromRef = instance;
          }}
        />,
      );
    });

    expect(imageInstanceFromRef).not.toBe(null);
    expect(imageInstanceFromCallback1).not.toBe(null);
    expect(imageInstanceFromCallback2).not.toBe(null);
    expect(imageInstanceFromCallback1).toBe(imageInstanceFromRef);
    expect(imageInstanceFromCallback2).toBe(imageInstanceFromRef);

    act(() => {
      testRenderer.update(<></>);
    });

    expect(imageInstanceFromRef).toBe(null);
    expect(imageInstanceFromCallback1).toBe(null);
    expect(imageInstanceFromCallback2).toBe(null);
  });

  it('should call image attached callbacks (multiple images)', () => {
    jest.dontMock('../Image');

    let imageInstancesFromCallback = new Set<ElementRef<typeof Image>>();

    ImageInjection.unstable_registerImageAttachedCallback(instance => {
      imageInstancesFromCallback.add(instance);

      return () => {
        imageInstancesFromCallback.delete(instance);
      };
    });

    expect(imageInstancesFromCallback.size).toBe(0);

    let testRenderer;

    let firstInstance;
    let secondInstance;

    const firstImageElement = (
      <Image
        key="first-image"
        source={{uri: 'foo-bar.jpg'}}
        ref={instance => {
          firstInstance = instance;
        }}
      />
    );

    const secondImageElement = (
      <Image
        key="second-image"
        source={{uri: 'foo-bar-baz.jpg'}}
        ref={instance => {
          secondInstance = instance;
        }}
      />
    );

    act(() => {
      testRenderer = create(
        <>
          {firstImageElement}
          {secondImageElement}
        </>,
      );
    });

    expect(firstInstance).not.toBe(null);
    expect(secondInstance).not.toBe(null);
    expect(imageInstancesFromCallback.size).toBe(2);
    expect([...imageInstancesFromCallback][0]).toBe(firstInstance);
    expect([...imageInstancesFromCallback][1]).toBe(secondInstance);

    act(() => {
      testRenderer.update(<>{secondImageElement}</>);
    });

    expect(firstInstance).toBe(null);
    expect(secondInstance).not.toBe(null);
    expect(imageInstancesFromCallback.size).toBe(1);
    expect([...imageInstancesFromCallback][0]).toBe(secondInstance);

    act(() => {
      testRenderer.update(<></>);
    });

    expect(firstInstance).toBe(null);
    expect(secondInstance).toBe(null);
    expect(imageInstancesFromCallback.size).toBe(0);
  });

  it('should resolve asset source even when Image module is mocked', async () => {
    jest.mock('../Image');
    const resolvedSource = Image.resolveAssetSource({uri: 'foo-bar.jpg'});
    expect(resolvedSource).toEqual({uri: 'foo-bar.jpg'});
  });

  it('should compute image size even when Image module is mocked', async () => {
    jest.mock('../Image');
    const mockOnGetSizeSuccess = jest.fn((width, height) => undefined);
    const mockSuccessCallback = (width: number, height: number) =>
      mockOnGetSizeSuccess(width, height);

    await Image.getSize('foo-bar.jpg', mockSuccessCallback);
    await jest.runAllTicks();

    expect(mockOnGetSizeSuccess).toHaveBeenCalledWith(320, 240);

    await Image.getSizeWithHeaders(
      'foo-bar.jpg',
      {header: 'foo'},
      mockSuccessCallback,
    );

    expect(mockOnGetSizeSuccess).toHaveBeenCalledWith(333, 222);
  });

  it('should call native prefetch methods when calling JS prefetch methods', async () => {
    jest.mock('../Image');
    await Image.prefetch('foo-bar.jpg');
    expect(NativeImageLoaderIOS.prefetchImage).toHaveBeenCalledWith(
      'foo-bar.jpg',
    );
    expect(NativeImageLoaderAndroid.prefetchImage).toHaveBeenCalledWith(
      'foo-bar.jpg',
    );

    await Image.prefetchWithMetadata('foo-bar.jpg', 'foo-queryRootName');
    expect(NativeImageLoaderIOS.prefetchImageWithMetadata).toHaveBeenCalledWith(
      'foo-bar.jpg',
      'foo-queryRootName',
      0,
    );
    expect(NativeImageLoaderAndroid.prefetchImage).toHaveBeenCalledWith(
      'foo-bar.jpg',
    );
  });

  it('should call native queryCache method when JS queryCache method is called', async () => {
    jest.mock('../Image');
    await Image.queryCache(['foo-bar.jpg']);
    expect(NativeImageLoaderIOS.queryCache).toHaveBeenCalledWith([
      'foo-bar.jpg',
    ]);
    expect(NativeImageLoaderIOS.queryCache).toHaveBeenCalledWith([
      'foo-bar.jpg',
    ]);
  });
});
