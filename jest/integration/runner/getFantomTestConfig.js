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

import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {extract, parse} from 'jest-docblock';

type DocblockPragmas = {[key: string]: string | string[]};
type FantomTestMode = 'dev' | 'opt';
type FantomTestConfig = {
  mode: FantomTestMode,
};

const DEFAULT_MODE: FantomTestMode = 'dev';

/**
 * Extracts the Fantom configuration from the test file, specified as part of
 * the docblock comment. E.g.:
 *
 * ```
 * /**
 *  * @flow strict-local
 *  * @fantom mode:opt
 *  *
 * ```
 *
 * So far the only supported option is `mode`, which can be 'dev' or 'opt'.
 */
export default function getFantomTestConfig(
  testPath: string,
): FantomTestConfig {
  const docblock = extract(fs.readFileSync(testPath, 'utf8'));
  const pragmas = parse(docblock) as DocblockPragmas;

  const config = {
    mode: DEFAULT_MODE,
  };

  const maybeMode = pragmas.fantom_mode;

  if (maybeMode != null) {
    if (Array.isArray(maybeMode)) {
      throw new Error('Expected a single value for @fantom_mode');
    }

    const mode = maybeMode;

    if (mode === 'dev' || mode === 'opt') {
      config.mode = mode;
    } else {
      throw new Error(`Invalid Fantom mode: ${mode}`);
    }
  }

  return config;
}
