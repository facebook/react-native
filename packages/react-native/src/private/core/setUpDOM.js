/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import DOMRect from '../webapis/dom/geometry/DOMRect';
import DOMRectReadOnly from '../webapis/dom/geometry/DOMRectReadOnly';

// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it
global.DOMRect = DOMRect;

// $FlowExpectedError[cannot-write] The global isn't writable anywhere but here, where we define it
global.DOMRectReadOnly = DOMRectReadOnly;
