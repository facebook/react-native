/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RNTesterAppModuleProvider.h"

#include <PackagesRnTesterAndroidAppSpec.h>
#include <ReactAndroidSpec.h>
#include <ReactCommon/SampleTurboModuleSpec.h>

namespace facebook {
namespace react {

std::shared_ptr<TurboModule> RNTesterAppModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {
  auto module = PackagesRnTesterAndroidAppSpec_ModuleProvider(moduleName, params);
  if (module != nullptr) {
    return module;
  }

  module = SampleTurboModuleSpec_ModuleProvider(moduleName, params);
  if (module != nullptr) {
    return module;
  }

  // TODO: fix up the ReactAndroidSpec_ModuleProvider() to avoid the Android prefix.
  if (moduleName == "DatePicker") {
    return std::make_shared<NativeDatePickerAndroidSpecJSI>(params);
  }
  if (moduleName == "DialogManager") {
    return std::make_shared<NativeDialogManagerAndroidSpecJSI>(params);
  }
  if (moduleName == "ImageLoader") {
    return std::make_shared<NativeImageLoaderAndroidSpecJSI>(params);
  }
  if (moduleName == "Networking") {
    return std::make_shared<NativeNetworkingAndroidSpecJSI>(params);
  }
  if (moduleName == "Permissions") {
    return std::make_shared<NativePermissionsAndroidSpecJSI>(params);
  }
  if (moduleName == "PlatformConstants") {
    return std::make_shared<NativePlatformConstantsAndroidSpecJSI>(params);
  }
  if (moduleName == "StatusBarManager") {
    return std::make_shared<NativeStatusBarManagerAndroidSpecJSI>(params);
  }
  if (moduleName == "Toast") {
    return std::make_shared<NativeToastAndroidSpecJSI>(params);
  }

  // TODO: handle some special case naming.
  if (moduleName == "IntentAndroid") {
    return std::make_shared<NativeLinkingSpecJSI>(params);
  }

  // TODO: Animated module has special cases.
  if ("NativeAnimatedModule" == moduleName) {
    return std::make_shared<NativeAnimatedModuleSpecJSI>(params);
  }
  if ("NativeAnimatedTurboModule" == moduleName) {
    return std::make_shared<NativeAnimatedTurboModuleSpecJSI>(params);
  }

  // TODO: handle multiple names for one spec.
  if ("AsyncLocalStorage" == moduleName) {
    return std::make_shared<NativeAsyncStorageSpecJSI>(params);
  }
  if ("AsyncSQLiteDBStorage" == moduleName) {
    return std::make_shared<NativeAsyncStorageSpecJSI>(params);
  }

  return ReactAndroidSpec_ModuleProvider(moduleName, params);
}

} // namespace react
} // namespace facebook
