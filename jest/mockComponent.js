/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = (moduleName, instanceMethods) => {
  const RealComponent = require.requireActual(moduleName);
  const React = require('react');

  const SuperClass =
    typeof RealComponent === 'function' ? RealComponent : React.Component;

  const Component = class extends SuperClass {
    render() {
      const name = RealComponent.displayName || RealComponent.name;

      return React.createElement(
        name.replace(/^(RCT|RK)/, ''),
        this.props,
        this.props.children,
      );
    }
  };

  if (RealComponent.propTypes != null) {
    Component.propTypes = RealComponent.propTypes;
  }

  if (instanceMethods != null) {
    Object.assign(Component.prototype, instanceMethods);
  }

  return Component;
};
