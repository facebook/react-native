/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = moduleName => {
  const RealComponent = require.requireActual(moduleName);
  const React = require('react');

  const Component = class extends RealComponent {
    render() {
      const name = RealComponent.displayName || RealComponent.name;

      return React.createElement(
        name.replace(/^(RCT|RK)/,''),
        this.props,
        this.props.children,
      );
    }
  };
  return Component;
};
