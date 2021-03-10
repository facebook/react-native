/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const renderNode = require('../renderNode');

describe('renderNode', () => {
  it('renders simple component', () => {
    class Test extends React.Component<{||}> {
      render() {
        return null;
      }
    }

    const component = ReactTestRenderer.create(renderNode(Test));
    expect(component).toMatchSnapshot();
  });
});
