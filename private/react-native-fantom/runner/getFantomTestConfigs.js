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

export type FantomTestConfigFeatureFlags = {
  common: FantomTestConfigCommonFeatureFlags,
  jsOnly: FantomTestConfigJsOnlyFeatureFlags,
  reactInternal: FantomTestConfigReactInternalFeatureFlags,
};

export type FantomTestConfig = {
  mode: FantomTestConfigMode,
  hermesVariant: HermesVariant,
  flags: FantomTestConfigFeatureFlags,
};

export type PartialFantomTestConfig = {
  mode?: FantomTestConfigMode,
  hermesVariant?: HermesVariant,
  flags?: Partial<FantomTestConfigFeatureFlags>,
};

export const FantomTestConfigHermesVariant = HermesVariant;

export const DEFAULT_MODE: FantomTestConfigMode =
  FantomTestConfigMode.DevelopmentWithSource;

export const DEFAULT_HERMES_VARIANT: HermesVariant = HermesVariant.Hermes;

export const DEFAULT_FEATURE_FLAGS: FantomTestConfigFeatureFlags = {
  common: {},
  jsOnly: {
    enableAccessToHostTreeInFabric: true,
  },
  reactInternal: {},
};

const FANTOM_FLAG_FORMAT = /^(\w+):((?:\w+)|\*)$/;

const FANTOM_BENCHMARK_FILENAME_RE = /[Bb]enchmark-itest\./g;
const FANTOM_BENCHMARK_SUITE_RE =
  /\n(Fantom\.)?unstable_benchmark(\s*)\.suite\(/g;

const FANTOM_BENCHMARK_DEFAULT_MODE: FantomTestConfigMode =
  FantomTestConfigMode.Optimized;

const MAX_FANTOM_CONFIGURATION_VARIATIONS = 12;

/**
 * Extracts the Fantom configurations from the test file, specified as part of
 * the docblock comment. E.g.:
 *
 * ```
 * /**
 *  * @flow strict-local
 *  * @fantom_mode opt
 *  * @fantom_hermes_variant static_hermes_stable
 *  * @fantom_flags commonTestFlag:true
 *  * @fantom_flags jsOnlyTestFlag:true
 *  * @fantom_react_fb_flags reactInternalFlag:true
 *  *
 * ```
 *
 * The supported options are:
 * - `fantom_mode`: specifies the level of optimization to compile the test
 *  with. Valid values are `dev`, `dev-bytecode` and `opt`.
 * - `fantom_hermes_variant`: specifies the Hermes variant to use to run the
 *  test. Valid values are `hermes`, `static_hermes_stable`,
 *  `static_hermes_staging` and `static_hermes_experimental`.
 * - `fantom_flags`: specifies the configuration for common and JS-only feature
 *  flags. They can be specified in the same pragma or in different ones, and
 *  the format is `<flag_name>:<value>`.
 *
 * If a wildcard (`*`) is used for any given value, we return a list of
 * configurations with all the combinations of values for those options (with
 * a limit of 12 configurations).
 */
export default function getFantomTestConfigs(
  testPath: string,
  testContents: string,
): Array<FantomTestConfig> {
  const docblock = extract(testContents);
  const pragmas = parse(docblock) as DocblockPragmas;

  const config: FantomTestConfig = {
    mode: DEFAULT_MODE,
    hermesVariant: DEFAULT_HERMES_VARIANT,
    flags: {
      common: {
        ...DEFAULT_FEATURE_FLAGS.common,
      },
      jsOnly: {
        ...DEFAULT_FEATURE_FLAGS.jsOnly,
      },
      reactInternal: {
        ...DEFAULT_FEATURE_FLAGS.reactInternal,
      },
    },
  };

  const maybeMode = pragmas.fantom_mode;

  const configVariations: Array<Array<PartialFantomTestConfig>> = [];

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
      case '*':
        configVariations.push([
          {mode: FantomTestConfigMode.DevelopmentWithSource},
          {mode: FantomTestConfigMode.DevelopmentWithBytecode},
          {mode: FantomTestConfigMode.Optimized},
        ]);
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
      case 'static_hermes_stable':
        config.hermesVariant = HermesVariant.StaticHermesStable;
        break;
      case 'static_hermes_staging':
        config.hermesVariant = HermesVariant.StaticHermesStaging;
        break;
      case 'static_hermes_experimental':
        config.hermesVariant = HermesVariant.StaticHermesExperimental;
        break;
      case '*':
        configVariations.push([
          {hermesVariant: HermesVariant.Hermes},
          {hermesVariant: HermesVariant.StaticHermesStable},
          {hermesVariant: HermesVariant.StaticHermesStaging},
          {hermesVariant: HermesVariant.StaticHermesExperimental},
        ]);
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
        if (rawValue === '*') {
          if (typeof flagConfig.defaultValue !== 'boolean') {
            throw new Error(
              `Invalid format for Fantom feature flag: ${rawFlagConfig}. Wildcards are not supported for non-boolean feature flags.`,
            );
          }
          configVariations.push([
            {flags: {common: {[name]: false}}},
            {flags: {common: {[name]: true}}},
          ]);
        } else {
          const value = parseFeatureFlagValue(
            flagConfig.defaultValue,
            rawValue,
          );
          config.flags.common[name] = value;
        }
      } else if (ReactNativeFeatureFlags.jsOnly[name]) {
        const flagConfig = ReactNativeFeatureFlags.jsOnly[name];
        if (rawValue === '*') {
          if (typeof flagConfig.defaultValue !== 'boolean') {
            throw new Error(
              `Invalid format for Fantom feature flag: ${rawFlagConfig}. Wildcards are not supported for non-boolean feature flags.`,
            );
          }
          configVariations.push([
            {flags: {jsOnly: {[name]: false}}},
            {flags: {jsOnly: {[name]: true}}},
          ]);
        } else {
          const value = parseFeatureFlagValue(
            flagConfig.defaultValue,
            rawValue,
          );
          config.flags.jsOnly[name] = value;
        }
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
      if (rawValue === '*') {
        configVariations.push([
          {flags: {reactInternal: {[name]: false}}},
          {flags: {reactInternal: {[name]: true}}},
        ]);
      } else {
        const value = parseFeatureFlagValue(false, rawValue);
        config.flags.reactInternal[name] = value;
      }
    }
  }

  const combinations = configVariations.reduce(
    (total, current) => total * current.length,
    1,
  );
  if (combinations > MAX_FANTOM_CONFIGURATION_VARIATIONS) {
    throw new Error(
      `Cannot define a test with more than ${MAX_FANTOM_CONFIGURATION_VARIATIONS} configuration variations. Please reduce the number of wildcard values (*) used in your test configuration.`,
    );
  }

  return getConfigurationVariations(config, configVariations);
}

function getConfigurationVariations(
  config: FantomTestConfig,
  variations: $ReadOnlyArray<$ReadOnlyArray<PartialFantomTestConfig>>,
): Array<FantomTestConfig> {
  if (variations.length === 0) {
    return [config];
  }

  const results: Array<FantomTestConfig> = [];
  const [currentConfigVariations, ...remainingVariations] = variations;

  for (const currentConfigVariation of currentConfigVariations) {
    const currentConfigWithVariation = {
      mode: currentConfigVariation.mode ?? config.mode,
      hermesVariant:
        currentConfigVariation.hermesVariant ?? config.hermesVariant,
      flags: {
        common: currentConfigVariation.flags?.common
          ? {
              ...config.flags.common,
              ...currentConfigVariation.flags.common,
            }
          : config.flags.common,
        jsOnly: currentConfigVariation.flags?.jsOnly
          ? {
              ...config.flags.jsOnly,
              ...currentConfigVariation.flags.jsOnly,
            }
          : config.flags.jsOnly,
        reactInternal: currentConfigVariation.flags?.reactInternal
          ? {
              ...config.flags.reactInternal,
              ...currentConfigVariation.flags.reactInternal,
            }
          : config.flags.reactInternal,
      },
    };

    results.push(
      ...getConfigurationVariations(
        currentConfigWithVariation,
        remainingVariations,
      ),
    );
  }

  return results;
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
