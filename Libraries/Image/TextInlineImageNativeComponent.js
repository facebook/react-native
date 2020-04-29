/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const requireNativeComponent = require('../ReactNative/requireNativeComponent');
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';

<<<<<<< HEAD
const TextInlineImage: string = requireNativeComponent('RCTTextInlineImage');
=======
const TextInlineImage: HostComponent<mixed> = requireNativeComponent<mixed>(
  'RCTTextInlineImage',
);
>>>>>>> fb/0.62-stable

module.exports = TextInlineImage;
