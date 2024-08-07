/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

/* eslint-env jest */

'use strict';

const React = require('react');

function mockModal(BaseComponent: $FlowFixMe) {
  class ModalMock extends BaseComponent {
    render(): React.MixedElement | null {
      if (this.props.visible === false) {
        return null;
      }

      return (
        <BaseComponent {...this.props}>{this.props.children}</BaseComponent>
      );
    }
  }
  return ModalMock;
}

module.exports = (mockModal: $FlowFixMe);
