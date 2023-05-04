/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');

let nativeTag = 1;

export default viewName => {
  const Component = class extends React.Component {
    _nativeTag = nativeTag++;

    render() {
      return React.createElement(viewName, this.props, this.props.children);
    }

    // The methods that exist on host components
    blur = jest.fn();
    focus = jest.fn();
    measure = jest.fn();
    measureInWindow = jest.fn();
    measureLayout = jest.fn();
    setNativeProps = jest.fn();
  };

  if (viewName === 'RCTView') {
    Component.displayName = 'View';
  } else {
    Component.displayName = viewName;
  }

  return Component;
};
