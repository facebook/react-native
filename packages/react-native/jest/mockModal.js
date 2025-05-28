/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as React from 'react';

export default function mockModal(
  BaseComponent: React.ComponentType<{children?: React.Node}>,
): React.ComponentType<{
  ...React.ElementConfig<typeof BaseComponent>,
  visible?: ?boolean,
}> {
  // $FlowIgnore[incompatible-use]
  return class ModalMock extends BaseComponent {
    render(): React.Node {
      if (this.props.visible === false) {
        return null;
      }

      return (
        <BaseComponent {...this.props}>{this.props.children}</BaseComponent>
      );
    }
  };
}
