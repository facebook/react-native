/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule fetch
 * @nolint
 *
 */
'use strict';

import 'whatwg-fetch';
const Platform = require('Platform');

const DEFAULT_CREDENTIALS = Platform.OS === 'ios' ? 'include' : 'omit';

const fetchWithCredentialsDefault = (input, init) => {
  if (input.credentials == null) {
    return fetch({ ...input, credentials: DEFAULT_CREDENTIALS }, init);
  }
  return fetch(input, init);
}

module.exports = {
  fetch: fetchWithCredentialsDefault,
  Headers,
  Request,
  Response
};
