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

      const props = Object.assign({}, RealComponent.defaultProps);

      if (this.props) {
        Object.keys(this.props).forEach(prop => {
          // We can't just assign props on top of defaultProps
          // because React treats undefined as special and different from null.
          // If a prop is specified but set to undefined it is ignored and the
          // default prop is used instead. If it is set to null, then the
          // null value overwrites the default value.
          if (this.props[prop] !== undefined) {
            props[prop] = this.props[prop];
          }
        });
      }

      return React.createElement(
        name.replace(/^(RCT|RK)/, ''),
        props,
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
