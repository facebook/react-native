/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+react_native
 */
'use strict';

const React = require('React');
const ReactTestRenderer = require('react-test-renderer');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');

describe('TouchableHighlight', () => {
  it('renders correctly', () => {
    const instance = ReactTestRenderer.create(
      <TouchableHighlight style={{}}>
        <Text>Touchable</Text>
      </TouchableHighlight>
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
  it('renders correctly with array of styles', () => {
    const instance = ReactTestRenderer.create(
      <TouchableHighlight style={[{backgroundColor:'red'}, {borderWidth:1}]}>
        <Text>Touchable</Text>
      </TouchableHighlight>
    );

    expect(instance.toJSON()).toMatchSnapshot();
  });
});
