package com.facebook.react.config;

/**
 * Hi there, traveller! This configuration class is not meant to be used by end-users of RN. It
 * contains mainly flags for features that are either under active development and not ready for
 * public consumption, or for use in experiments.
 *
 * These values are safe defaults and should not require manual changes.
 */
public class ReactFeatureFlags {

  /**
   * Whether we should load a specific view manager immediately or when it is accessed by JS
   */
  public static boolean lazilyLoadViewManagers = false;

}
