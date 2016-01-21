/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react;

import java.util.HashSet;
import java.util.Set;


/**
 * This class exposes a way to enable/disable experimental features in React Native.
 */
public class Experiments {

  // Enables Hot Module Replacement menu item in the developer menu
  public static String HOT_MODULE_REPLACEMENT = "HOT_MODULE_REPLACEMENT";

  private static Set<String> enabledExperiments;

  /**
   * Enables an experiment
   */
  public static void enableExperiment(String experiment) {
    if (enabledExperiments == null) {
      enabledExperiments = new HashSet<>();
    }
    enabledExperiments.add(experiment);
  }

  /**
   * Disables an experiment
   */
  public static void disableExperiment(String experiment) {
    if (enabledExperiments != null) {
      enabledExperiments.remove(experiment);
    }
  }

  /**
   * Checks if an experiment is enabled
   */
  public static boolean isExperimentEnabled(String experiment) {
    return enabledExperiments != null && enabledExperiments.contains(experiment);
  }
}
