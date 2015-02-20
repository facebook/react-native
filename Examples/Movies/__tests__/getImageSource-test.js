/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

jest.dontMock('../getImageSource');

var getImageSource = require('../getImageSource');

describe('getImageSource', () => {
  it('returns null for invalid input', () => {
    expect(getImageSource().uri).toBe(null);
  });

  it('returns a movie thumbnail', () => {
    var uri = 'https://facebook.com';
    var source = {
      posters: {
        thumbnail: uri,
      },
    };
    expect(getImageSource(source).uri).toBe(uri);
  });

  it('returns a movie thumbnail with kind', () => {
    var uri = 'https://facebook.com?tmb';
    var source = {
      posters: {
        thumbnail: uri,
      },
    };
    expect(getImageSource(source, 'kind').uri).toBe(
      'https://facebook.com?kind'
    );
  });
});
