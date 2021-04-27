/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import ModalCustomizable from './ModalCustomizable';
import ModalOnShow from './ModalOnShow';
import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';

export const displayName = (undefined: ?string);
export const framework = 'React';
export const title = 'Modal';
export const category = 'UI';
export const documentationURL = 'https://reactnative.dev/docs/modal';
export const description = 'Component for presenting modal views.';
export const examples = ([
  ModalCustomizable,
  ModalOnShow,
]: Array<RNTesterExampleModuleItem>);
