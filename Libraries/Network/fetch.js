/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
