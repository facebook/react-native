/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict-local
 * @format
 */

import combine from '../combine-js-to-schema';

jest.mock(
  '/test/module/SchemaOne',
  () => ({
    modules: {
      ComponentOne: {
        foo: 'baz',
      },
    },
  }),
  {virtual: true},
);

jest.mock(
  '/test/module/SchemaTwo',
  () => ({
    modules: {
      ComponentTwo: {
        foo: 'bar',
      },
    },
  }),
  {virtual: true},
);

jest.mock('/test/module/NotASchema', () => ({}), {virtual: true});

test('should combine files', () => {
  const files = [
    '/test/module/SchemaOne',
    '/test/module/SchemaTwo',
    '/test/module/NotASchema',
  ];
  expect(combine(files)).toMatchSnapshot();
});

test('should not throw for failed require', () => {
  const files = ['/test/module/does/not/exist'];
  expect(() => combine(files)).not.toThrow();
});
