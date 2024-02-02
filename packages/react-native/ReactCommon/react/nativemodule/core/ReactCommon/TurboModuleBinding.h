/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ReactCommon/LongLivedObject.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook::react {

class BridgelessNativeModuleProxy : public jsi::HostObject {
 public:
  explicit BridgelessNativeModuleProxy(
      std::unique_ptr<TurboModuleBinding> binding);

  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;

  void set(
      jsi::Runtime& runtime,
      const jsi::PropNameID& /*name*/,
      const jsi::Value& /*value*/) override;

 private:
  std::unique_ptr<TurboModuleBinding> binding_;
};

/**
 * An app/platform-specific provider function to get an instance of a
 * BridgelessNativeModuleProxy.
 */
using BridgelessNativeModuleProxyFactoryFunctionType =
    std::function<std::shared_ptr<BridgelessNativeModuleProxy>(
        std::unique_ptr<TurboModuleBinding> binding)>;

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
      jsi::Runtime& runtime,
      TurboModuleProviderFunctionType&& moduleProvider,
      TurboModuleProviderFunctionType&& legacyModuleProvider = nullptr,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection =
          nullptr,
      BridgelessNativeModuleProxyFactoryFunctionType&&
          nativeModuleProxyFactory = nullptr);

  TurboModuleBinding(
      TurboModuleProviderFunctionType&& moduleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection);

  virtual ~TurboModuleBinding();

 private:
  friend BridgelessNativeModuleProxy;

  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value getModule(jsi::Runtime& runtime, const std::string& moduleName)
      const;

  TurboModuleProviderFunctionType moduleProvider_;
  std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
};

} // namespace facebook::react
