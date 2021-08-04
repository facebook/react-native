/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ReactCommon/LongLivedObject.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

class JSCallInvoker;

/**
 * Represents the JavaScript binding for the TurboModule system.
 */
class TurboModuleBinding {
 public:
  /*
   * Installs TurboModuleBinding into JavaScript runtime.
   * Thread synchronization must be enforced externally.
   */
  static void install(
      jsi::Runtime &runtime,
      const TurboModuleProviderFunctionType &&moduleProvider);
  static void install(
      jsi::Runtime &runtime,
      const TurboModuleProviderFunctionType &&moduleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection);

  TurboModuleBinding(const TurboModuleProviderFunctionType &&moduleProvider);
  TurboModuleBinding(
      const TurboModuleProviderFunctionType &&moduleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection);
  virtual ~TurboModuleBinding();

  /**
   * Get an TurboModule instance for the given module name.
   */
  std::shared_ptr<TurboModule> getModule(const std::string &name);

 private:
  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value jsProxy(
      jsi::Runtime &runtime,
      const jsi::Value &thisVal,
      const jsi::Value *args,
      size_t count);

  TurboModuleProviderFunctionType moduleProvider_;
  std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
  bool disableGlobalLongLivedObjectCollection_;
};

} // namespace react
} // namespace facebook
