/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.autoMockOff();

const babel = require('babel-core');

describe('platform directives', () => {
  function transform(source, platform) {
    return babel.transform(source, {
      plugins: [
        [require('../'), {platform}]
      ],
    }).code;
  }

  it('should transform __ANDROID__', () => {
    expect(transform('__ANDROID__;', 'ios')).toEqual('false;');
    expect(transform('__ANDROID__;', 'android')).toEqual('true;');
    expect(transform('if (__ANDROID__) ;', 'ios')).toEqual('if (false) ;');
    expect(transform('if (__ANDROID__) ;', 'android')).toEqual('if (true) ;');
  });

  it('should transform __IOS__', () => {
    expect(transform('__IOS__;', 'ios')).toEqual('true;');
    expect(transform('__IOS__;', 'android')).toEqual('false;');
    expect(transform('if (__IOS__) ;', 'ios')).toEqual('if (true) ;');
    expect(transform('if (__IOS__) ;', 'android')).toEqual('if (false) ;');
  });
});
