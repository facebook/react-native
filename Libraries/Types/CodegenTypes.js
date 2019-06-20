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

import type {NativeComponent} from '../Renderer/shims/ReactNative';
import type {SyntheticEvent} from './CoreEventTypes';

// Event types
export type BubblingEvent<T> = SyntheticEvent<T>;
export type DirectEvent<T> = SyntheticEvent<T>;

// Prop types
export type Float = number;
export type Int32 = number;

// Default handling, ignore the unused value
// we're only using it for type checking
//
// TODO: (rickhanlonii) T44881457 If a default is provided, it should always be optional
//  but that is currently not supported in the codegen since we require a default
//
// eslint-disable-next-line no-unused-vars
export type WithDefault<Type: number | boolean | string, Value: Type> = Type;
