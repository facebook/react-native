/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @emails oncall+react_native
 */

'use strict';

const parseHermesStack = require('../parseHermesStack');

describe('parseHermesStack', () => {
  test('bytecode location', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (address at unknown:1:9)',
          '    at foo$bar (address at /js/foo.hbc:10:1234)',
        ].join('\n'),
      ),
    ).toMatchSnapshot();
  });

  test('source location', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchSnapshot();
  });

  test('tolerate empty filename', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    at foo$bar (:10:1234)',
        ].join('\n'),
      ),
    ).toMatchSnapshot();
  });

  test('skipped frames', () => {
    expect(
      parseHermesStack(
        [
          'TypeError: undefined is not a function',
          '    at global (unknown:1:9)',
          '    ... skipping 50 frames',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchSnapshot();
  });

  test('ignore frames that are part of message', () => {
    expect(
      parseHermesStack(
        [
          'The next line is not a stack frame',
          '    at bogus (filename:1:2)',
          '    but the real stack trace follows below.',
          '    at foo$bar (/js/foo.js:10:1234)',
        ].join('\n'),
      ),
    ).toMatchSnapshot();
  });
});
