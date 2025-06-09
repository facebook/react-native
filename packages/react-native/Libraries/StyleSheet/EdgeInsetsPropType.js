/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {Rect, RectOrSize} from './Rect';

// TODO: allow all EdgeInsets-like property to be set using a single number
// and unify EdgeInsetsProp with EdgeInsetsOrSizeProp
export type EdgeInsetsProp = Rect;
export type EdgeInsetsOrSizeProp = RectOrSize;
