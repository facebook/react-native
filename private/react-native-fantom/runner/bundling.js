/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RunBuildOptions} from 'metro';

import fs from 'fs';
import path from 'path';

type BundleOptions = {
  ...RunBuildOptions,
  customTransformOptions: ?{
    collectCoverage: boolean,
  },
  out: $NonMaybeType<RunBuildOptions['out']>,
  testPath: string,
};

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

export async function createBundle(options: BundleOptions): Promise<void> {
  let lastBundleResult;
  let lastBundleError;

  // Retry in case Metro hasn't seen the changes in the filesystem yet.
  // TODO(T231910841): Remove this when Metro fixes consistency issues when resolving HTTP requests.
  let attemps = 0;
  do {
    if (attemps > 0) {
      await sleep(500);
    }

    lastBundleError = null;
    lastBundleResult = null;

    try {
      lastBundleResult = await fetch(getBundleURL(options));
    } catch (e) {
      lastBundleError = e;
    }

    attemps++;
  } while (
    attemps < 3 &&
    (lastBundleError || lastBundleResult?.status === 404)
  );

  if (lastBundleError || lastBundleResult?.ok !== true) {
    throw new Error(
      `Failed to request bundle from Metro: ${lastBundleError?.message ?? (await lastBundleResult?.text()) ?? ''}`,
    );
  }

  await fs.promises.writeFile(
    options.out,
    await lastBundleResult.text(),
    'utf8',
  );
}

export async function createSourceMap(options: BundleOptions): Promise<void> {
  const sourceMapResult = await fetch(getSourceMapURL(options));

  if (!sourceMapResult.ok) {
    throw new Error();
  }

  await fs.promises.writeFile(
    options.out,
    await sourceMapResult.text(),
    'utf8',
  );
}

function getBundleURL(options: BundleOptions): URL {
  const baseURL = getBundleBaseURL(options);
  baseURL.pathname += '.bundle';
  return baseURL;
}

function getSourceMapURL(options: BundleOptions): URL {
  const baseURL = getBundleBaseURL(options);
  baseURL.pathname += '.map';
  return baseURL;
}

function getBundleBaseURL({
  entry,
  platform,
  minify,
  dev,
  sourceMap,
  sourceMapUrl,
  customTransformOptions,
}: BundleOptions): URL {
  const requestPath = path.relative(PROJECT_ROOT, entry).replace(/\.js$/, '');
  const port = getMetroPort();

  const baseURL = new URL(`http://localhost:${port}/${requestPath}`);

  if (platform != null) {
    baseURL.searchParams.append('platform', platform);
  }

  if (minify != null) {
    baseURL.searchParams.append('minify', minify ? 'true' : 'false');
  }

  if (dev != null) {
    baseURL.searchParams.append('dev', dev ? 'true' : 'false');
  }

  if (sourceMap != null) {
    baseURL.searchParams.append('sourceMap', sourceMap ? 'true' : 'false');
  }

  if (sourceMapUrl != null) {
    baseURL.searchParams.append('sourceMapUrl', sourceMapUrl);
  }

  if (customTransformOptions?.collectCoverage) {
    baseURL.searchParams.append('transform.collectCoverage', 'true');
  }

  return baseURL;
}

function getMetroPort(): number {
  if (process.env.__FANTOM_METRO_PORT__ == null) {
    throw new Error(
      'Could not find Metro server port (process.env.__FANTOM_METRO_PORT__ not set by Fantom)',
    );
  }

  const port = Number(process.env.__FANTOM_METRO_PORT__);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port for Metro server: ${port}`);
  }

  return port;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
