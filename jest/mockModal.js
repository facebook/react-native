/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
const Modal = require('../Libraries/Modal/Modal');

function mockModal(BaseComponent: $FlowFixMe) {
  class ModalMock extends BaseComponent {
    render(): React.Element<typeof Modal> {
      return (
        <BaseComponent {...this.props}>
          {this.props.visible !== true ? null : this.props.children}
        </BaseComponent>
      );
    }
  }
  return ModalMock;
}

module.exports = (mockModal: $FlowFixMe);
