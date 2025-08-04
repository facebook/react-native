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

type CreateBundleOptions = {
  ...RunBuildOptions,
  out: $NonMaybeType<RunBuildOptions['out']>,
  testPath: string,
};

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

export default async function createBundle({
  testPath,
  entry,
  out,
  platform,
  minify,
  dev,
  sourceMap,
  sourceMapUrl,
}: CreateBundleOptions): Promise<void> {
  if (process.env.__FANTOM_METRO_PORT__ == null) {
    throw new Error(
      'Could not find Metro server port (process.env.__FANTOM_METRO_PORT__ not set by Fantom)',
    );
  }

  const port = Number(process.env.__FANTOM_METRO_PORT__);
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port for Metro server: ${port}`);
  }

  const requestPath = path
    .relative(PROJECT_ROOT, entry)
    .replace(/\.js$/, '.bundle');

  const bundleURL = new URL(`http://localhost:${port}/${requestPath}`);

  if (platform != null) {
    bundleURL.searchParams.append('platform', platform);
  }

  if (minify != null) {
    bundleURL.searchParams.append('minify', minify ? 'true' : 'false');
  }

  if (dev != null) {
    bundleURL.searchParams.append('dev', dev ? 'true' : 'false');
  }

  if (sourceMap != null) {
    bundleURL.searchParams.append('sourceMap', sourceMap ? 'true' : 'false');
  }

  if (sourceMapUrl != null) {
    bundleURL.searchParams.append('sourceMapUrl', sourceMapUrl);
  }

  let bundleResult;
  let bundleError;

  // Retry in case Metro hasn't seen the changes in the filesystem yet.
  // TODO(T231910841): Remove this when Metro fixes consistency issues when resolving HTTP requests.
  let attemps = 0;
  do {
    if (attemps > 0) {
      await sleep(500);
    }

    try {
      bundleResult = await fetch(bundleURL);
    } catch (e) {
      bundleError = e;
    }

    attemps++;
  } while (attemps < 3 && (bundleError || bundleResult?.status === 404));

  if (bundleError || bundleResult?.ok !== true) {
    throw new Error(
      `Failed to request bundle from Metro: ${bundleError?.message ?? (await bundleResult?.text()) ?? ''}`,
    );
  }
  await fs.promises.writeFile(out, await bundleResult.text(), 'utf8');

  try {
    const sourceMapURL = new URL(bundleURL.toString());
    sourceMapURL.pathname = sourceMapURL.pathname.replace(/\.bundle$/, '.map');
    const sourceMapResult = await fetch(sourceMapURL);
    if (!sourceMapResult.ok) {
      throw new Error();
    }
    await fs.promises.writeFile(
      out.replace(/\.js$/, '.map'),
      await sourceMapResult.text(),
      'utf8',
    );
  } catch (e) {
    console.error(`Could not fetch source map from Metro for test ${testPath}`);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
