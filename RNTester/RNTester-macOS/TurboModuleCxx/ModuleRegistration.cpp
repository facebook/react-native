// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

///////////////////////////////////////////////////////////////////////////////
//                              IMPORTANT
//
// This file is used in both react-native-windows and react-native-macos
//     windows: vntext/Microsoft.ReactNative.Cxx
//     macOS:   RNTester/RNTester-macOS/TurboModuleCxx
// You are required to commit exactly the same content to both repo
// A decision will be made in the near future to prevent from duplicating files
///////////////////////////////////////////////////////////////////////////////

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
