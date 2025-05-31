/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from '../../types';

import {
  DO_NOT_MODIFY_COMMENT,
  getKotlinTypeFromDefaultValue,
} from '../../utils';
import signedsource from 'signedsource';

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

package com.facebook.react.internal.featureflags

import androidx.annotation.VisibleForTesting

/**
 * This object provides access to internal React Native feature flags.
 *
 * All the methods are thread-safe if you handle \`override\` correctly.
 */
public object ReactNativeFeatureFlags {
  private var accessorProvider: () -> ReactNativeFeatureFlagsAccessor = { ReactNativeFeatureFlagsCxxAccessor() }
  private var accessor: ReactNativeFeatureFlagsAccessor = accessorProvider()

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  /**
   * ${flagConfig.metadata.description}
   */
  @JvmStatic
  public fun ${flagName}(): ${getKotlinTypeFromDefaultValue(flagConfig.defaultValue)} = accessor.${flagName}()`,
  )
  .join('\n\n')}

  /**
   * Overrides the feature flags with the ones provided by the given provider
   * (generally one that extends \`ReactNativeFeatureFlagsDefaults\`).
   *
   * This method must be called before you initialize the React Native runtime.
   *
   * @example
   *
   * \`\`\`
   * ReactNativeFeatureFlags.override(object : ReactNativeFeatureFlagsDefaults() {
   *   override fun someFlag(): Boolean = true // or a dynamic value
   * })
   * \`\`\`
   */
  @JvmStatic
  public fun override(provider: ReactNativeFeatureFlagsProvider): Unit = accessor.override(provider)

  /**
   * Removes the overridden feature flags and makes the API return default
   * values again.
   *
   * This should only be called if you destroy the React Native runtime and
   * need to create a new one with different overrides. In that case,
   * call \`dangerouslyReset\` after destroying the runtime and \`override\`
   * again before initializing the new one.
   */
  @JvmStatic
  public fun dangerouslyReset() {
    // This is necessary when the accessor interops with C++ and we need to
    // remove the overrides set there.
    accessor.dangerouslyReset()

    // This discards the cached values and the overrides set in the JVM.
    accessor = accessorProvider()
  }

  /**
   * This is a combination of \`dangerouslyReset\` and \`override\` that reduces
   * the likeliness of a race condition between the two calls.
   *
   * This is **dangerous** because it can introduce consistency issues that will
   * be much harder to debug. For example, it could hide the fact that feature
   * flags are read before you set the values you want to use everywhere. It
   * could also cause a workflow to suddenly have different feature flags for
   * behaviors that were configured with different values before.
   *
   * It returns a string that contains the feature flags that were accessed
   * before this call (or between the last call to \`dangerouslyReset\` and this
   * call). If you are using this method, you do not want the hard crash that
   * you would get from using \`dangerouslyReset\` and \`override\` separately,
   * but you should still log this somehow.
   *
   * Please see the documentation of \`dangerouslyReset\` for additional details.
   */
  @JvmStatic
  public fun dangerouslyForceOverride(provider: ReactNativeFeatureFlagsProvider): String? {
    val newAccessor = accessorProvider()
    val previouslyAccessedFlags = newAccessor.dangerouslyForceOverride(provider)
    accessor = newAccessor
    return previouslyAccessedFlags
  }

  /**
   * This is just used to replace the default ReactNativeFeatureFlagsCxxAccessor
   * that uses JNI with a version that doesn't, to simplify testing.
   */
  @VisibleForTesting
  internal fun setAccessorProvider(newAccessorProvider: () -> ReactNativeFeatureFlagsAccessor) {
    accessorProvider = newAccessorProvider
    accessor = accessorProvider()
  }
}
`);
}
