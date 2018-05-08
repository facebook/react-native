/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
