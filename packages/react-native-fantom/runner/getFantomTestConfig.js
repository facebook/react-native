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

import ReactNativeFeatureFlags from '../../../packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {extract, parse} from 'jest-docblock';

type CommonFeatureFlags = (typeof ReactNativeFeatureFlags)['common'];
type JsOnlyFeatureFlags = (typeof ReactNativeFeatureFlags)['jsOnly'];

type DocblockPragmas = {[key: string]: string | string[]};

export enum FantomTestConfigMode {
  DevelopmentWithBytecode,
  DevelopmentWithSource,
  Optimized,
}

export type FantomTestConfigCommonFeatureFlags = Partial<{
  [key in keyof CommonFeatureFlags]: CommonFeatureFlags[key]['defaultValue'],
}>;

export type FantomTestConfigJsOnlyFeatureFlags = Partial<{
  [key in keyof JsOnlyFeatureFlags]: JsOnlyFeatureFlags[key]['defaultValue'],
}>;

export type FantomTestConfig = {
  mode: FantomTestConfigMode,
  flags: {
    common: FantomTestConfigCommonFeatureFlags,
    jsOnly: FantomTestConfigJsOnlyFeatureFlags,
  },
};

const DEFAULT_MODE: FantomTestConfigMode =
  FantomTestConfigMode.DevelopmentWithSource;

const FANTOM_FLAG_FORMAT = /^(\w+):(\w+)$/;

/**
 * Extracts the Fantom configuration from the test file, specified as part of
 * the docblock comment. E.g.:
 *
 * ```
 * /**
 *  * @flow strict-local
 *  * @fantom_mode opt
 *  * @fantom_flags commonTestFlag:true
 *  * @fantom_flags jsOnlyTestFlag:true
 *  *
 * ```
 *
 * The supported options are:
 * - `fantom_mode`: specifies the level of optimization to compile the test
 *  with. Valid values are `dev` and `opt`.
 * - `fantom_flags`: specifies the configuration for common and JS-only feature
 *  flags. They can be specified in the same pragma or in different ones, and
 *  the format is `<flag_name>:<value>`.
 */
export default function getFantomTestConfig(
  testPath: string,
): FantomTestConfig {
  const docblock = extract(fs.readFileSync(testPath, 'utf8'));
  const pragmas = parse(docblock) as DocblockPragmas;

  const config: FantomTestConfig = {
    mode: DEFAULT_MODE,
    flags: {
      common: {},
      jsOnly: {},
    },
  };

  const maybeMode = pragmas.fantom_mode;

  if (maybeMode != null) {
    if (Array.isArray(maybeMode)) {
      throw new Error('Expected a single value for @fantom_mode');
    }

    const mode = maybeMode;

    switch (mode) {
      case 'dev':
        config.mode = FantomTestConfigMode.DevelopmentWithSource;
        break;
      case 'dev-bytecode':
        config.mode = FantomTestConfigMode.DevelopmentWithBytecode;
        break;
      case 'opt':
        config.mode = FantomTestConfigMode.Optimized;
        break;
      default:
        throw new Error(`Invalid Fantom mode: ${mode}`);
    }
  }

  const maybeRawFlagConfig = pragmas.fantom_flags;

  if (maybeRawFlagConfig != null) {
    const rawFlagConfigs = (
      Array.isArray(maybeRawFlagConfig)
        ? maybeRawFlagConfig
        : [maybeRawFlagConfig]
    ).flatMap(value => value.split(/\s+/g));

    for (const rawFlagConfig of rawFlagConfigs) {
      const matches = FANTOM_FLAG_FORMAT.exec(rawFlagConfig);
      if (matches == null) {
        throw new Error(
          `Invalid format for Fantom feature flag: ${rawFlagConfig}. Expected <flag_name>:<value>`,
        );
      }

      const [, name, rawValue] = matches;

      if (ReactNativeFeatureFlags.common[name]) {
        const flagConfig = ReactNativeFeatureFlags.common[name];
        const value = parseFeatureFlagValue(flagConfig.defaultValue, rawValue);
        config.flags.common[name] = value;
      } else if (ReactNativeFeatureFlags.jsOnly[name]) {
        const flagConfig = ReactNativeFeatureFlags.jsOnly[name];
        const value = parseFeatureFlagValue(flagConfig.defaultValue, rawValue);
        config.flags.jsOnly[name] = value;
      } else {
        const validKeys = Object.keys(ReactNativeFeatureFlags.common)
          .concat(Object.keys(ReactNativeFeatureFlags.jsOnly))
          .join(', ');

        throw new Error(
          `Invalid Fantom feature flag: ${name}. Valid flags are: ${validKeys}`,
        );
      }
    }
  }

  return config;
}

function parseFeatureFlagValue<T: boolean | number | string>(
  defaultValue: T,
  value: string,
): T {
  switch (typeof defaultValue) {
    case 'boolean':
      if (value === 'true') {
        // $FlowExpectedError[incompatible-return] at this point we know T is a boolean
        return true;
      } else if (value === 'false') {
        // $FlowExpectedError[incompatible-return] at this point we know T is a boolean
        return false;
      } else {
        throw new Error(`Invalid value for boolean flag: ${value}`);
      }
    case 'number':
      const parsed = Number(value);

      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid value for number flag: ${value}`);
      }

      // $FlowExpectedError[incompatible-return] at this point we know T is a number
      return parsed;
    case 'string':
      // $FlowExpectedError[incompatible-return] at this point we know T is a string
      return value;
    default:
      throw new Error(`Unsupported feature flag type: ${typeof defaultValue}`);
  }
}
