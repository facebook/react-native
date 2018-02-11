/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule fetch
 *
 */

 /* globals Headers, Request, Response */

'use strict';

import whatwg from 'whatwg-fetch';

if (whatwg && whatwg.fetch) {
  module.exports = whatwg;
} else {
  module.exports = {fetch, Headers, Request, Response};
}
