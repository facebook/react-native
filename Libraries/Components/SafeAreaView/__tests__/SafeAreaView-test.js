/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 * @flow
 */

'use strict';

const React = require('react');
const SafeAreaView = require('../SafeAreaView');
const render = require('../../../../jest/renderer');
const View = require('../../View/View');
const Text = require('../../../Text/Text');

describe('<SafeAreaView />', () => {
  it('should render as <SafeAreaView> when mocked', () => {
    const instance = render.create(
      <SafeAreaView>
        <View>
          <Text>Hello World!</Text>
        </View>
      </SafeAreaView>,
    );
    expect(instance).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(SafeAreaView)> when mocked', () => {
    const output = render.shallow(
      <SafeAreaView>
        <View>
          <Text>Hello World!</Text>
        </View>
      </SafeAreaView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should shallow render as <ForwardRef(SafeAreaView)> when not mocked', () => {
    jest.dontMock('../SafeAreaView');

    const output = render.shallow(
      <SafeAreaView>
        <View>
          <Text>Hello World!</Text>
        </View>
      </SafeAreaView>,
    );
    expect(output).toMatchSnapshot();
  });

  it('should render as <SafeAreaView> when not mocked', () => {
    jest.dontMock('../SafeAreaView');

    const instance = render.create(
      <SafeAreaView>
        <View>
          <Text>Hello World!</Text>
        </View>
      </SafeAreaView>,
    );
    expect(instance).toMatchSnapshot();
  });
});
