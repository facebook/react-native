/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {FeatureFlagValue} from '../../../packages/react-native/scripts/featureflags/types';

import ReactNativeFeatureFlags from '../../../packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config';
import {HermesVariant} from './utils';
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

export type FantomTestConfigReactInternalFeatureFlags = {
  [key: string]: FeatureFlagValue,
};

export type FantomTestConfig = {
  mode: FantomTestConfigMode,
  hermesVariant: HermesVariant,
  flags: {
    common: FantomTestConfigCommonFeatureFlags,
    jsOnly: FantomTestConfigJsOnlyFeatureFlags,
    reactInternal: FantomTestConfigReactInternalFeatureFlags,
  },
};

const DEFAULT_MODE: FantomTestConfigMode =
  FantomTestConfigMode.DevelopmentWithSource;

const DEFAULT_HERMES_MODE: HermesVariant = HermesVariant.Hermes;

const FANTOM_FLAG_FORMAT = /^(\w+):(\w+)$/;

const FANTOM_BENCHMARK_FILENAME_RE = /[Bb]enchmark-itest\./g;
const FANTOM_BENCHMARK_SUITE_RE =
  /\n(Fantom\.)?unstable_benchmark(\s*)\.suite\(/g;

const FANTOM_BENCHMARK_DEFAULT_MODE: FantomTestConfigMode =
  FantomTestConfigMode.Optimized;

/**
 * Extracts the Fantom configuration from the test file, specified as part of
 * the docblock comment. E.g.:
 *
 * ```
 * /**
 *  * @flow strict-local
 *  * @fantom_mode opt
 *  * @fantom_hermes_variant static_hermes
 *  * @fantom_flags commonTestFlag:true
 *  * @fantom_flags jsOnlyTestFlag:true
 *  * @fantom_react_fb_flags reactInternalFlag:true
 *  *
 * ```
 *
 * The supported options are:
 * - `fantom_mode`: specifies the level of optimization to compile the test
 *  with. Valid values are `dev` and `opt`.
 * - `fantom_hermes_variant`: specifies the Hermes variant to use to run the
 *  test. Valid values are `hermes`, `static_hermes` and
 *  `static_hermes_experimental`.
 * - `fantom_flags`: specifies the configuration for common and JS-only feature
 *  flags. They can be specified in the same pragma or in different ones, and
 *  the format is `<flag_name>:<value>`.
 */
export default function getFantomTestConfig(
  testPath: string,
): FantomTestConfig {
  const testContents = fs.readFileSync(testPath, 'utf8');

  const docblock = extract(testContents);
  const pragmas = parse(docblock) as DocblockPragmas;

  const config: FantomTestConfig = {
    mode: DEFAULT_MODE,
    hermesVariant: DEFAULT_HERMES_MODE,
    flags: {
      common: {},
      jsOnly: {
        enableAccessToHostTreeInFabric: true,
      },
      reactInternal: {},
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
  } else {
    if (
      FANTOM_BENCHMARK_FILENAME_RE.test(testPath) ||
      FANTOM_BENCHMARK_SUITE_RE.test(testContents)
    ) {
      config.mode = FANTOM_BENCHMARK_DEFAULT_MODE;
    }
  }

  const maybeHermesVariant = pragmas.fantom_hermes_variant;

  if (maybeHermesVariant != null) {
    if (Array.isArray(maybeHermesVariant)) {
      throw new Error('Expected a single value for @fantom_hermes_variant');
    }

    const hermesVariant = maybeHermesVariant;

    switch (hermesVariant) {
      case 'hermes':
        config.hermesVariant = HermesVariant.Hermes;
        break;
      case 'static_hermes':
        config.hermesVariant = HermesVariant.StaticHermes;
        break;
      case 'static_hermes_experimental':
        config.hermesVariant = HermesVariant.StaticHermesExperimental;
        break;
      default:
        throw new Error(`Invalid Fantom Hermes mode: ${hermesVariant}`);
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

  const maybeReactInternalRawFlagConfig = pragmas.fantom_react_fb_flags;

  if (maybeReactInternalRawFlagConfig != null) {
    const reactInternalRawFlagConfigs = (
      Array.isArray(maybeReactInternalRawFlagConfig)
        ? maybeReactInternalRawFlagConfig
        : [maybeReactInternalRawFlagConfig]
    ).flatMap(value => value.split(/\s+/g));

    for (const reactInternalRawFlagConfig of reactInternalRawFlagConfigs) {
      const matches = FANTOM_FLAG_FORMAT.exec(reactInternalRawFlagConfig);
      if (matches == null) {
        throw new Error(
          `Invalid format for Fantom React fb feature flag: ${reactInternalRawFlagConfig}. Expected <flag_name>:<value>`,
        );
      }

      const [, name, rawValue] = matches;
      const value = parseFeatureFlagValue(false, rawValue);
      config.flags.reactInternal[name] = value;
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
