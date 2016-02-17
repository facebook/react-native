// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

/**
 * Constants used by ReactMarker.
 */
public class ReactMarkerConstants {

  public static final String CREATE_REACT_CONTEXT_START = "CREATE_REACT_CONTEXT_START";
  public static final String CREATE_REACT_CONTEXT_END = "CREATE_REACT_CONTEXT_END";
  public static final String PROCESS_PACKAGES_START = "PROCESS_PACKAGES_START";
  public static final String PROCESS_PACKAGES_END = "PROCESS_PACKAGES_END";
  public static final String BUILD_NATIVE_MODULE_REGISTRY_START =
      "BUILD_NATIVE_MODULE_REGISTRY_START";
  public static final String BUILD_NATIVE_MODULE_REGISTRY_END =
      "BUILD_NATIVE_MODULE_REGISTRY_END";
  public static final String BUILD_JS_MODULE_CONFIG_START = "BUILD_JS_MODULE_CONFIG_START";
  public static final String BUILD_JS_MODULE_CONFIG_END = "BUILD_JS_MODULE_CONFIG_END";
  public static final String CREATE_CATALYST_INSTANCE_START = "CREATE_CATALYST_INSTANCE_START";
  public static final String CREATE_CATALYST_INSTANCE_END = "CREATE_CATALYST_INSTANCE_END";
  public static final String RUN_JS_BUNDLE_START = "RUN_JS_BUNDLE_START";
  public static final String RUN_JS_BUNDLE_END = "RUN_JS_BUNDLE_END";
}
