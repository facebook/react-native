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

'use strict';

const generator = require('../GenerateComponentDescriptorH.js');

const {
  ARRAY_PROPS,
  BOOLEAN_PROP,
  STRING_PROP,
  INTEGER_PROPS,
  FLOAT_PROPS,
  COLOR_PROP,
  IMAGE_PROP,
  POINT_PROP,
  MULTI_NATIVE_PROP,
  ENUM_PROP,
  EVENT_PROPS,
  TWO_COMPONENTS_SAME_FILE,
  TWO_COMPONENTS_DIFFERENT_FILES,
} = require('../__test_fixtures__/fixtures.js');

describe('GenerateComponentDescriptorH', () => {
  it('can generate a array props', () => {
    expect(generator.generate('ARRAY_PROPS', ARRAY_PROPS)).toMatchSnapshot();
  });

  it('can generate a single boolean prop', () => {
    expect(generator.generate('BOOLEAN_PROP', BOOLEAN_PROP)).toMatchSnapshot();
  });

  it('can generate a single string prop', () => {
    expect(generator.generate('STRING_PROPS', STRING_PROP)).toMatchSnapshot();
  });

  it('can generate integer props', () => {
    expect(
      generator.generate('INTEGER_PROPS', INTEGER_PROPS),
    ).toMatchSnapshot();
  });

  it('can generate float props', () => {
    expect(generator.generate('FLOAT_PROPS', FLOAT_PROPS)).toMatchSnapshot();
  });

  it('can generate a single native primitive prop', () => {
    expect(generator.generate('COLOR_PROP', COLOR_PROP)).toMatchSnapshot();
  });

  it('can generate a native primitive image prop', () => {
    expect(generator.generate('IMAGE_PROP', IMAGE_PROP)).toMatchSnapshot();
  });

  it('can generate a native primitive point prop', () => {
    expect(generator.generate('IMAGE_PROP', POINT_PROP)).toMatchSnapshot();
  });

  it('can generate multiple native props', () => {
    expect(
      generator.generate('MULTI_NATIVE_PROP', MULTI_NATIVE_PROP),
    ).toMatchSnapshot();
  });

  it('can generate enum props', () => {
    expect(generator.generate('ENUM_PROP', ENUM_PROP)).toMatchSnapshot();
  });

  it('can generate events', () => {
    expect(generator.generate('EVENT_PROPS', EVENT_PROPS)).toMatchSnapshot();
  });

  it('supports two components from same module', () => {
    expect(
      generator.generate('TWO_COMPONENTS_SAME_FILE', TWO_COMPONENTS_SAME_FILE),
    ).toMatchSnapshot();
  });

  it('supports two components from different modules', () => {
    expect(
      generator.generate(
        'TWO_COMPONENTS_DIFFERENT_FILES',
        TWO_COMPONENTS_DIFFERENT_FILES,
      ),
    ).toMatchSnapshot();
  });
});
