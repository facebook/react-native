/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {resolveHermesArtifact} = require('../download-spm-artifacts');

// ---------------------------------------------------------------------------
// resolveHermesArtifact — hermes uses its own version space, decoupled from
// React Native's nightly cadence. The default behavior mirrors RN's
// CocoaPods prebuild (HERMES_VERSION='latest-v1'): resolve via the
// hermes-compiler npm dist-tag instead of trying to download a hermes-ios
// artifact at the RN nightly version (which won't exist on Maven).
// ---------------------------------------------------------------------------

describe('resolveHermesArtifact', () => {
  let origFetch;
  let origHermesEnv;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    origHermesEnv = process.env.HERMES_VERSION;
    delete process.env.HERMES_VERSION;
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    if (origHermesEnv !== undefined) {
      process.env.HERMES_VERSION = origHermesEnv;
    } else {
      delete process.env.HERMES_VERSION;
    }
  });

  // Mock fetch with a router: each entry's key is a URL substring; the value
  // describes the response. Anything not matched returns 404 (mimicking the
  // "release not found, try snapshot" path).
  function mockFetch(routes /*: {[string]: any} */) {
    globalThis.fetch = jest.fn(async url => {
      for (const [key, resp] of Object.entries(routes)) {
        if (String(url).includes(key)) {
          return {
            ok: resp.ok ?? true,
            status: resp.status ?? 200,
            json: async () => resp.json,
            text: async () => resp.text ?? '',
          };
        }
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({}),
        text: async () => '',
      };
    });
  }

  describe('default behavior (no HERMES_VERSION set)', () => {
    it('resolves to the latest-v1 hermes-compiler dist-tag, NOT the RN version', async () => {
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        // Pretend the release URL exists once we ask for 0.13.0.
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-20260519-58cd1bf58',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.0');
      expect(result.url).toContain('/0.13.0/');
      // The RN nightly hash MUST NOT leak into the hermes URL.
      expect(result.url).not.toContain('20260519');
    });

    it('ignores rawVersion (the RN --version arg) when HERMES_VERSION is unset', async () => {
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      // Caller passes the original RN --version verbatim; hermes should
      // still default to latest-v1 instead of using this.
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-20260519-58cd1bf58',
        'debug',
        '0.87.0-nightly-20260519-58cd1bf58',
      );
      expect(result.version).toBe('0.13.0');
      expect(result.url).not.toContain('20260519');
    });
  });

  describe('HERMES_VERSION escape hatches', () => {
    it('HERMES_VERSION=<literal-version> uses it verbatim', async () => {
      process.env.HERMES_VERSION = '0.13.5';
      mockFetch({
        'hermes-ios/0.13.5/hermes-ios-0.13.5': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.5');
      expect(result.url).toContain('/0.13.5/');
    });

    it('HERMES_VERSION=latest-v1 resolves via npm dist-tag', async () => {
      process.env.HERMES_VERSION = 'latest-v1';
      mockFetch({
        'hermes-compiler/latest-v1': {json: {version: '0.13.0'}},
        'hermes-ios/0.13.0/hermes-ios-0.13.0': {ok: true},
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.13.0');
    });

    it('HERMES_VERSION=nightly resolves hermes-compiler@nightly from npm', async () => {
      process.env.HERMES_VERSION = 'nightly';
      mockFetch({
        'hermes-compiler/nightly': {json: {version: '0.14.0-nightly-abc'}},
        'hermes-ios/0.14.0-nightly-abc/hermes-ios-0.14.0-nightly-abc': {
          ok: true,
        },
      });
      const result = await resolveHermesArtifact(
        '0.87.0-nightly-anything',
        'debug',
        null,
      );
      expect(result.version).toBe('0.14.0-nightly-abc');
    });
  });
});
