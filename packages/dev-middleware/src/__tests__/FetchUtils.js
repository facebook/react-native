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
import type {RequestOptions} from 'undici';

import {Agent, request} from 'undici';

declare var globalThis: $FlowFixMe;

/**
 * A version of `fetch` that is usable with the HTTPS server created in
 * ServerUtils (which uses a self-signed certificate).
 */
export async function requestLocal(
  url: string,
  options?: RequestOptions,
): Promise<{
  statusCode: number,
  headers: Headers,
  bodyBuffer: Buffer,
}> {
  const {
    statusCode,
    headers: rawHeaders,
    body,
  } = await request(url, {
    ...options,

    // Use undici's `dispatcher` to make it accept self-signed certificates.
    dispatcher:
      options?.dispatcher ??
      new Agent({
        connect: {
          rejectUnauthorized: false,
        },
      }),
  });
  return {
    statusCode,
    bodyBuffer: await body.read(),
    headers: new Headers(rawHeaders),
  };
}

export async function fetchJson<T: JSONSerializable>(url: string): Promise<T> {
  const response = await requestLocal(url);
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode}`);
  }
  if (!response.headers.get('Content-Type')?.startsWith('application/json')) {
    throw new Error('Expected Content-Type: application/json');
  }
  return JSON.parse(response.bodyBuffer.toString());
}

/**
 * Change the global fetch dispatcher to allow self-signed certificates.
 * This runs with Jest's `beforeAll` and `afterAll`, and restores the original dispatcher.
 */
export function withFetchSelfSignedCertsForAllTests() {
  const fetchOriginal = globalThis.fetch;
  const selfSignedCertDispatcher = new Agent({
    connect: {
      rejectUnauthorized: false,
    },
  });

  let fetchSpy;

  beforeAll(() => {
    // For some reason, setting the `selfSignedCertDispatcher` with `setGlobalDispatcher` doesn't work.
    // Instead of using `setGlobalDispatcher`, we'll use a spy to intercept the fetch calls and add the dispatcher.
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url, options) =>
        fetchOriginal(url, {
          ...options,
          dispatcher: options?.dispatcher ?? selfSignedCertDispatcher,
        }),
      );
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });
}
