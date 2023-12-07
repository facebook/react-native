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

import {act, create} from 'react-test-renderer';

const render = require('../../../jest/renderer');
const Image = require('../Image');
const ImageInjection = require('../ImageInjection');
const React = require('react');

describe('<Image />', () => {
  it('should render as <Image> when mocked', () => {
    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <Image> when mocked', () => {
    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(Image)> when not mocked', () => {
    jest.dontMock('../Image');

    const output = render.shallow(<Image source={{uri: 'foo-bar.jpg'}} />);
    expect(output).toMatchSnapshot();
  });

  it('should render as <RCTImageView> when not mocked', () => {
    jest.dontMock('../Image');

    const instance = render.create(<Image source={{uri: 'foo-bar.jpg'}} />);
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
});
