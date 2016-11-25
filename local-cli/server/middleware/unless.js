/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

module.exports = (url, middleware) => {
  return (req, res, next) =>  {
    if (req.url === url || req.url.startsWith(url + '/')) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
};
