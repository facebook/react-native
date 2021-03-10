/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

type ReactNode = React.ComponentType<any> | React.Element<any> | boolean | null;

/**
 * A simple function that renders a React Node.
 *
 * @param {ReactNode} Component - Can be a React Component Class, a render function, or a rendered element.
 */
function renderNode(Component?: ReactNode): React.Element<any> | null {
  if (!Component) {
    return null;
  } else if (
    React.isValidElement(Component) ||
    typeof Component !== 'function'
  ) {
    return (Component: any);
  } else {
    return <Component />;
  }
}

module.exports = renderNode;
