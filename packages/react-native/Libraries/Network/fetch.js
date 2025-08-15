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

// side-effectful require() to put fetch,
// Headers, Request, Response in global scope
require('whatwg-fetch');

export const fetch = global.fetch;
export const Headers = global.Headers;
export const Request = global.Request;
export const Response = global.Response;
