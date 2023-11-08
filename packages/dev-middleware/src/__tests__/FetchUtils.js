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

import type {JSONSerializable} from '../inspector-proxy/types';

import {Agent} from 'undici';

/**
 * A version of `fetch` that is usable with the HTTPS server created in
 * ServerUtils (which uses a self-signed certificate).
 */
export async function fetchLocal(
  url: string,
  options?: Parameters<typeof fetch>[1] & {dispatcher?: mixed},
): ReturnType<typeof fetch> {
  return await fetch(url, {
    ...options,
    // Node's native `fetch` comes from undici and supports the same options,
    // including `dispatcher` which we use to make it accept self-signed
    // certificates.
    dispatcher:
      options?.dispatcher ??
      new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      }),
  });
}

export async function fetchJson<T: JSONSerializable>(url: string): Promise<T> {
  const response = await fetchLocal(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}
