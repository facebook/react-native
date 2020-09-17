// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "ModuleRegistration.h"

namespace winrt::Microsoft::ReactNative {

const ModuleRegistration *ModuleRegistration::s_head{nullptr};

ModuleRegistration::ModuleRegistration(wchar_t const *moduleName) noexcept : m_moduleName{moduleName}, m_next{s_head} {
  s_head = this;
}

void AddAttributedModules(IReactPackageBuilder const &packageBuilder) noexcept {
  for (auto const *reg = ModuleRegistration::Head(); reg != nullptr; reg = reg->Next()) {
    packageBuilder.AddModule(reg->ModuleName(), reg->MakeModuleProvider());
  }
}

bool TryAddAttributedModule(IReactPackageBuilder const &packageBuilder, std::wstring_view moduleName) noexcept {
  for (auto const *reg = ModuleRegistration::Head(); reg != nullptr; reg = reg->Next()) {
    if (moduleName == reg->ModuleName()) {
      packageBuilder.AddModule(moduleName, reg->MakeModuleProvider());
      return true;
    }
  }
  return false;
}

} // namespace winrt::Microsoft::ReactNative
