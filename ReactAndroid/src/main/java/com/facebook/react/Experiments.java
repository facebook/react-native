package com.facebook.react;

import java.util.HashSet;
import java.util.Set;

public class Experiments {

  public static String HOT_MODULE_REPLACEMENT = "HOT_MODULE_REPLACEMENT";

  private static Set<String> enabledExperiments;

  public static void enableExperiment(String experiment) {
    if (enabledExperiments == null) {
      enabledExperiments = new HashSet<>();
    }
    enabledExperiments.add(experiment);
  }

  public static void disableExperiment(String experiment) {
    if (enabledExperiments != null) {
      enabledExperiments.remove(experiment);
    }
  }

  public static boolean isExperimentEnabled(String experiment) {
    return enabledExperiments != null && enabledExperiments.contains(experiment);
  }
}
