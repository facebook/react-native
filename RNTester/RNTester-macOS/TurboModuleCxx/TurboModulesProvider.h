// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once

#include <TurboModuleRegistry.h>
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::Microsoft::ReactNative {

class TurboModulesProvider final : public facebook::react::TurboModuleRegistry {
 private:
  using TurboModule = facebook::react::TurboModule;
  using CallInvoker = facebook::react::CallInvoker;

  using TurboModulePtr = std::shared_ptr<TurboModule>;
  using CallInvokerPtr = std::shared_ptr<CallInvoker>;

 public:
  virtual TurboModulePtr getModule(const std::string &moduleName, const CallInvokerPtr &callInvoker) noexcept override;
  virtual std::vector<std::string> getEagerInitModuleNames() noexcept override;

 public:
  void SetReactContext(const IReactContext &reactContext) noexcept;
  void AddModuleProvider(winrt::hstring const &moduleName, ReactModuleProvider const &moduleProvider) noexcept;

 private:
  std::unordered_map<std::string, ReactModuleProvider> m_moduleProviders;
  std::unordered_map<std::pair<std::string, CallInvokerPtr>, TurboModulePtr> m_cachedModules;
  IReactContext m_reactContext;
};

} // namespace winrt::Microsoft::ReactNative
