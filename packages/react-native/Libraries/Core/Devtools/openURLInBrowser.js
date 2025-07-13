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

const getDevServer = require('./getDevServer').default;

export default function openURLInBrowser(url: string) {
  // $FlowFixMe[unused-promise]
  fetch(getDevServer().url + 'open-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({url}),
  });
}
