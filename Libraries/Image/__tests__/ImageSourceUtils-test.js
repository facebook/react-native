/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

const {getImageSourcesFromImageProps} = require('../ImageSourceUtils');

describe('ImageSourceUtils', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('source prop provided', () => {
    const imageProps = {source: require('./img/img1.png')};
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
  });

  it('should ignore source when src is provided', () => {
    let uri = 'imageURI';
    const imageProps = {source: require('./img/img1.png'), src: uri};
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    expect(sources[0].uri).toBe(uri);
  });

  it('should ignore source and src when srcSet is provided', () => {
    let uri = 'imageURI';

    let uri1 = 'uri1';
    let scale1 = '1x';

    let uri2 = 'uri2';
    let scale2 = '2x';

    const imageProps = {
      source: require('./img/img1.png'),
      src: uri,
      srcSet: `${uri1} ${scale1}, ${uri2} ${scale2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    expect(sources[0]).toEqual(expect.objectContaining({uri: uri1, scale: 1}));
    expect(sources[1]).toEqual(expect.objectContaining({uri: uri2, scale: 2}));
  });

  it('should use src as default when 1x scale is not provided in srcSet', () => {
    let uri = 'imageURI';

    let uri1 = 'uri1';
    let scale1 = '3x';

    let uri2 = 'uri2';
    let scale2 = '2x';

    const imageProps = {
      src: uri,
      srcSet: `${uri1} ${scale1}, ${uri2} ${scale2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(3);
    expect(sources[0]).toEqual(expect.objectContaining({uri: uri1, scale: 3}));
    expect(sources[1]).toEqual(expect.objectContaining({uri: uri2, scale: 2}));
    expect(sources[2]).toEqual(expect.objectContaining({uri: uri, scale: 1}));
  });

  it('should use 1x as default scale if only url is provided in srcSet', () => {
    let uri1 = 'uri1';
    let scale1 = '2x';

    let uri2 = 'uri2';

    const imageProps = {
      srcSet: `${uri1} ${scale1}, ${uri2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(2);
    expect(sources[0]).toEqual(expect.objectContaining({uri: uri1, scale: 2}));
    expect(sources[1]).toEqual(expect.objectContaining({uri: uri2, scale: 1}));
  });

  it('should warn when an unsupported scale is provided in srcSet', () => {
    const mockWarn = jest.spyOn(console, 'warn');
    let uri1 = 'uri1';
    let scale1 = '300w';

    let uri2 = 'uri2';

    const imageProps = {
      srcSet: `${uri1} ${scale1}, ${uri2}`,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    expect(mockWarn).toHaveBeenCalled();
  });

  it('should contain crossorigin headers when provided with src', () => {
    let uri = 'imageURI';

    const imageProps = {
      src: uri,
      crossOrigin: 'use-credentials',
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveProperty('headers', {
      ['Access-Control-Allow-Credentials']: 'true',
    });
  });

  it('should contain referrerPolicy headers when provided with src', () => {
    let uri = 'imageURI';

    let referrerPolicy = 'origin-when-cross-origin';
    const imageProps = {
      src: uri,
      referrerPolicy: referrerPolicy,
    };
    const sources = getImageSourcesFromImageProps(imageProps);

    expect(sources).toBeDefined();
    expect(sources).toHaveLength(1);
    expect(sources[0]).toHaveProperty('headers', {
      ['Referrer-Policy']: referrerPolicy,
    });
  });
});
