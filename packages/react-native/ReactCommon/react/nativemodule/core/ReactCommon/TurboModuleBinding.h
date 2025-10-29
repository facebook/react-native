/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <jsi/jsi.h>
#include <react/bridging/LongLivedObject.h>

#include <ReactCommon/TurboModule.h>

namespace facebook::react {

class BridgelessNativeModuleProxy;

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
      TurboModuleProviderFunctionType &&moduleProvider,
      TurboModuleProviderFunctionType &&legacyModuleProvider = nullptr,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection = nullptr);

  TurboModuleBinding(
      jsi::Runtime &runtime,
      TurboModuleProviderFunctionType &&moduleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection);

  virtual ~TurboModuleBinding();

 private:
  friend BridgelessNativeModuleProxy;

  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value getModule(jsi::Runtime &runtime, const std::string &moduleName) const;

  jsi::Runtime &runtime_;
  TurboModuleProviderFunctionType moduleProvider_;
  std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
};

} // namespace facebook::react
