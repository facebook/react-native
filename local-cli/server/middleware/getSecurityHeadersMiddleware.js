/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @strict
 * @format
 */

module.exports = function(req, res, next) {
  const address = req.client.server.address();

  // Block any cross origin request.
  if (
    req.headers.origin &&
    req.headers.origin !== `http://localhost:${address.port}`
  ) {
    next(new Error('Unauthorized'));
    return;
  }

  // Block MIME-type sniffing.
  res.setHeader('X-Content-Type-Options', 'nosniff');

  next();
};
