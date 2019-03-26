/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// This type allows Facebook to internally Override
// this type to allow our internationalization type which
// is a string at runtime but Flow doesn't know that.
declare type Stringish = string;
