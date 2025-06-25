/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import {existsSync} from 'fs';
import path from 'path';

export const printCLIOutput: boolean = Boolean(process.env.FANTOM_PRINT_OUTPUT);

export const logCommands: boolean = Boolean(process.env.FANTOM_LOG_COMMANDS);

export const enableCppDebugging: boolean = Boolean(
  process.env.FANTOM_ENABLE_CPP_DEBUGGING,
);

const testerHasBuckTarget = existsSync(
  path.join(__dirname, '..', 'tester', 'BUCK'),
);
export const isOSS: boolean = Object.hasOwn(
  process.env,
  'FANTOM_FORCE_OSS_BUILD',
)
  ? Boolean(process.env.FANTOM_FORCE_OSS_BUILD)
  : !testerHasBuckTarget;
