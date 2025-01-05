/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {requestLocal} from './FetchUtils';
import {withServerForEachTest} from './ServerUtils';

jest.useRealTimers();
jest.setTimeout(10000);

describe('embedder script', () => {
  const serverRef = withServerForEachTest({
    logger: undefined,
    projectRoot: '',
  });

  test('is always served', async () => {
    const resp = await requestLocal(
      serverRef.serverBaseUrl +
        '/debugger-frontend/embedder-static/embedderScript.js',
    );
    expect(resp.statusCode).toBe(200);
  });
});
