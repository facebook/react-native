/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
