/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ModalProps} from '../../Libraries/Modal/Modal';
import typeof * as TmockComponent from '../mockComponent';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;

type TModal = component(...ModalProps);

const BaseComponent = mockComponent(
  '../Libraries/Modal/Modal',
  null, // instanceMethods
  true, // isESModule
) as TModal;

// $FlowIgnore[incompatible-use]
export default class Modal extends BaseComponent {
  render(): React.Node {
    if (this.props.visible === false) {
      return null;
    }
    return <BaseComponent {...this.props}>{this.props.children}</BaseComponent>;
  }
}
