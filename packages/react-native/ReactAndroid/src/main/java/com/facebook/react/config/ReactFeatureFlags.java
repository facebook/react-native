/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.config;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.proguard.annotations.DoNotStripAny;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * <p>These values are safe defaults and should not require manual changes.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@Deprecated(since = "Use com.facebook.react.internal.featureflags.ReactNativeFeatureFlags instead.")
@DoNotStripAny
public class ReactFeatureFlags {

  public static boolean dispatchPointerEvents = false;

  /**
   * Enable prop iterator setter-style construction of Props in C++ (this flag is not used in Java).
   */
  public static boolean enableCppPropsIteratorSetter = false;
}
