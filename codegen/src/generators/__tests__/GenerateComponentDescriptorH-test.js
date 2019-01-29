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
  SINGLE_COMPONENT_WITH_BOOLEAN_PROP,
  SINGLE_COMPONENT_WITH_STRING_PROP,
  SINGLE_COMPONENT_WITH_INTEGER_PROPS,
  SINGLE_COMPONENT_WITH_FLOAT_PROPS,
  SINGLE_COMPONENT_WITH_COLOR_PROP,
  SINGLE_COMPONENT_WITH_ENUM_PROP,
  SINGLE_COMPONENT_WITH_EVENT_PROPS,
  TWO_COMPONENTS_SAME_FILE,
  TWO_COMPONENTS_DIFFERENT_FILES,
} = require('../__test_fixtures__/fixtures.js');

describe('GenerateComponentDescriptorH', () => {
  it('can generate a single boolean prop', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_BOOLEAN_PROP',
        SINGLE_COMPONENT_WITH_BOOLEAN_PROP,
      ),
    ).toMatchSnapshot();
  });

  it('can generate a single string prop', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_STRING_PROPS',
        SINGLE_COMPONENT_WITH_STRING_PROP,
      ),
    ).toMatchSnapshot();
  });

  it('can generate integer props', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_INTEGER_PROPS',
        SINGLE_COMPONENT_WITH_INTEGER_PROPS,
      ),
    ).toMatchSnapshot();
  });

  it('can generate float props', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_FLOAT_PROPS',
        SINGLE_COMPONENT_WITH_FLOAT_PROPS,
      ),
    ).toMatchSnapshot();
  });

  it('can generate a single native primitive prop', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_COLOR_PROP',
        SINGLE_COMPONENT_WITH_COLOR_PROP,
      ),
    ).toMatchSnapshot();
  });

  it('can generate enum props', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_ENUM_PROP',
        SINGLE_COMPONENT_WITH_ENUM_PROP,
      ),
    ).toMatchSnapshot();
  });

  it('can generate events', () => {
    expect(
      generator.generate(
        'SINGLE_COMPONENT_WITH_EVENT_PROPS',
        SINGLE_COMPONENT_WITH_EVENT_PROPS,
      ),
    ).toMatchSnapshot();
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
