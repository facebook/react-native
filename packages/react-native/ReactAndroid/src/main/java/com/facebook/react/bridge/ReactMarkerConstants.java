/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

/** Constants used by ReactMarker. */
public enum ReactMarkerConstants {
  APP_STARTUP_START(true),
  APP_STARTUP_END(true),
  CREATE_REACT_CONTEXT_START,
  CREATE_REACT_CONTEXT_END(true),
  INIT_REACT_RUNTIME_START(true),
  INIT_REACT_RUNTIME_END(true),
  PROCESS_PACKAGES_START,
  PROCESS_PACKAGES_END,
  BUILD_NATIVE_MODULE_REGISTRY_START,
  BUILD_NATIVE_MODULE_REGISTRY_END,
  CREATE_CATALYST_INSTANCE_START,
  CREATE_CATALYST_INSTANCE_END,
  DESTROY_CATALYST_INSTANCE_START,
  DESTROY_CATALYST_INSTANCE_END,
  RUN_JS_BUNDLE_START(true),
  RUN_JS_BUNDLE_END(true),
  NATIVE_MODULE_INITIALIZE_START,
  NATIVE_MODULE_INITIALIZE_END,
  SETUP_REACT_CONTEXT_START,
  SETUP_REACT_CONTEXT_END,
  CHANGE_THREAD_PRIORITY,
  CREATE_UI_MANAGER_MODULE_START,
  CREATE_UI_MANAGER_MODULE_END,
  CREATE_VIEW_MANAGERS_START,
  CREATE_VIEW_MANAGERS_END,
  CREATE_UI_MANAGER_MODULE_CONSTANTS_START,
  CREATE_UI_MANAGER_MODULE_CONSTANTS_END,
  NATIVE_MODULE_SETUP_START(true),
  NATIVE_MODULE_SETUP_END(true),
  CREATE_MODULE_START,
  CREATE_MODULE_END,
  PROCESS_CORE_REACT_PACKAGE_START,
  PROCESS_CORE_REACT_PACKAGE_END,
  CREATE_I18N_MODULE_CONSTANTS_START,
  CREATE_I18N_MODULE_CONSTANTS_END,
  I18N_MODULE_CONSTANTS_CONVERT_START,
  I18N_MODULE_CONSTANTS_CONVERT_END,
  CREATE_I18N_ASSETS_MODULE_START,
  CREATE_I18N_ASSETS_MODULE_END,
  GET_CONSTANTS_START,
  GET_CONSTANTS_END,
  INITIALIZE_MODULE_START,
  INITIALIZE_MODULE_END,
  ON_HOST_RESUME_START,
  ON_HOST_RESUME_END,
  ON_HOST_PAUSE_START,
  ON_HOST_PAUSE_END,
  CONVERT_CONSTANTS_START,
  CONVERT_CONSTANTS_END,
  PRE_REACT_CONTEXT_END,
  UNPACKING_JS_BUNDLE_LOADER_CHECK_START,
  UNPACKING_JS_BUNDLE_LOADER_CHECK_END,
  UNPACKING_JS_BUNDLE_LOADER_EXTRACTED,
  UNPACKING_JS_BUNDLE_LOADER_BLOCKED,
  loadApplicationScript_startStringConvert(true),
  loadApplicationScript_endStringConvert(true),
  PRE_SETUP_REACT_CONTEXT_START,
  PRE_SETUP_REACT_CONTEXT_END,
  PRE_RUN_JS_BUNDLE_START,
  ATTACH_MEASURED_ROOT_VIEWS_START,
  ATTACH_MEASURED_ROOT_VIEWS_END,
  CONTENT_APPEARED,
  RELOAD,
  DOWNLOAD_START,
  DOWNLOAD_END,
  REACT_CONTEXT_THREAD_START,
  REACT_CONTEXT_THREAD_END,
  GET_REACT_INSTANCE_MANAGER_START,
  GET_REACT_INSTANCE_MANAGER_END,
  GET_REACT_INSTANCE_HOLDER_SPEC_START,
  GET_REACT_INSTANCE_HOLDER_SPEC_END,
  BUILD_REACT_INSTANCE_MANAGER_START,
  BUILD_REACT_INSTANCE_MANAGER_END,
  PROCESS_INFRA_PACKAGE_START,
  PROCESS_INFRA_PACKAGE_END,
  PROCESS_PRODUCT_PACKAGE_START,
  PROCESS_PRODUCT_PACKAGE_END,
  CREATE_MC_MODULE_START,
  CREATE_MC_MODULE_END,
  CREATE_MC_MODULE_GET_METADATA_START,
  CREATE_MC_MODULE_GET_METADATA_END,
  REGISTER_JS_SEGMENT_START(true),
  REGISTER_JS_SEGMENT_STOP(true),
  VM_INIT,
  ON_FRAGMENT_CREATE,
  JAVASCRIPT_EXECUTOR_FACTORY_INJECT_START,
  JAVASCRIPT_EXECUTOR_FACTORY_INJECT_END,
  LOAD_REACT_NATIVE_SO_FILE_START,
  LOAD_REACT_NATIVE_SO_FILE_END,
  ROOT_VIEW_ON_MEASURE_START,
  ROOT_VIEW_ON_MEASURE_END,
  ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_START,
  ROOT_VIEW_ATTACH_TO_REACT_INSTANCE_MANAGER_END,
  ROOT_VIEW_UPDATE_LAYOUT_SPECS_START,
  ROOT_VIEW_UPDATE_LAYOUT_SPECS_END,
  // Fabric-specific constants below this line
  LOAD_REACT_NATIVE_FABRIC_SO_FILE_START,
  LOAD_REACT_NATIVE_FABRIC_SO_FILE_END,
  FABRIC_COMMIT_START,
  FABRIC_COMMIT_END,
  FABRIC_FINISH_TRANSACTION_START,
  FABRIC_FINISH_TRANSACTION_END,
  FABRIC_DIFF_START,
  FABRIC_DIFF_END,
  FABRIC_LAYOUT_START,
  FABRIC_LAYOUT_END,
  FABRIC_LAYOUT_AFFECTED_NODES,
  FABRIC_LAYOUT_TOTAL_NODES,
  FABRIC_BATCH_EXECUTION_START,
  FABRIC_BATCH_EXECUTION_END,
  FABRIC_UPDATE_UI_MAIN_THREAD_START,
  FABRIC_UPDATE_UI_MAIN_THREAD_END,
  // New markers used by bridge and bridgeless loading below this line
  REACT_BRIDGE_LOADING_START,
  REACT_BRIDGE_LOADING_END,
  REACT_BRIDGELESS_LOADING_START,
  REACT_BRIDGELESS_LOADING_END,
  LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_START,
  LOAD_REACT_NATIVE_MAPBUFFER_SO_FILE_END;

  private boolean mHasMatchingNameMarker;

  ReactMarkerConstants() {
    this(false);
  }

  ReactMarkerConstants(boolean hasMatchingNameMarker) {
    mHasMatchingNameMarker = hasMatchingNameMarker;
  }

  public boolean hasMatchingNameMarker() {
    return mHasMatchingNameMarker;
  }
}
