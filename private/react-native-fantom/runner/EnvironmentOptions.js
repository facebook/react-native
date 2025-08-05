/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const VALID_ENVIRONMENT_VARIABLES = [
  'FANTOM_DEBUG_CPP',
  'FANTOM_ENABLE_CPP_DEBUGGING',
  'FANTOM_FORCE_CI_MODE',
  'FANTOM_FORCE_OSS_BUILD',
  'FANTOM_FORCE_TEST_MODE',
  'FANTOM_LOG_COMMANDS',
  'FANTOM_PRINT_OUTPUT',
  'FANTOM_PROFILE_JS',
];

/**
 * Prints the output of the Fantom tester to the test output.
 */
export const printCLIOutput: boolean = Boolean(process.env.FANTOM_PRINT_OUTPUT);

/**
 * Logs all external commands executed by the runner.
 */
export const logCommands: boolean = Boolean(process.env.FANTOM_LOG_COMMANDS);

/**
 * Enables the C++ debugger for the current test run.
 */
export const debugCpp: boolean =
  Boolean(process.env.FANTOM_DEBUG_CPP) ||
  // Legacy
  Boolean(process.env.FANTOM_ENABLE_CPP_DEBUGGING);

/**
 * Indicates if the current test run is done in an OSS environment (as opposed
 * to internal Meta infra).
 */
export const isOSS: boolean = Boolean(process.env.FANTOM_FORCE_OSS_BUILD);

/**
 * Indicates if the current test run is done in CI, which forces:
 * 1. Prebuilding all binaries (Fantom tester and Hermes compiler).
 * 2. Running benchmarks in test mode (see below).
 */
export const isCI: boolean =
  Boolean(process.env.FANTOM_FORCE_CI_MODE) ||
  Boolean(process.env.SANDCASTLE) ||
  Boolean(process.env.GITHUB_ACTIONS);

/**
 * Forces benchmarks to run in test mode (running a single time to ensure
 * correctness instead of multiples times to measure performance).
 */
export const forceTestModeForBenchmarks: boolean = Boolean(
  process.env.FANTOM_FORCE_TEST_MODE,
);

export const profileJS: boolean = Boolean(process.env.FANTOM_PROFILE_JS);

/**
 * Throws an error if there is an environment variable defined with the FANTOM_
 * prefix that is not recognized.
 */
export function validateEnvironmentVariables(): void {
  for (const key of Object.keys(process.env)) {
    if (
      key.startsWith('FANTOM_') &&
      !VALID_ENVIRONMENT_VARIABLES.includes(key)
    ) {
      throw new Error(
        `Unexpected Fantom environment variable: ${key}=${String(process.env[key])}. Accepted variables are: ${VALID_ENVIRONMENT_VARIABLES.join(', ')}`,
      );
    }
  }
}
