// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#include "winrt/Microsoft.ReactNative.h"

// We implement optional parameter macros based on the StackOverflow discussion:
// https://stackoverflow.com/questions/3046889/optional-parameters-with-c-macros
// Please refer to it if you want to understand it works.
#define INTERNAL_REACT_GET_ARG_4(arg1, arg2, arg3, arg4, ...) arg4
#define INTERNAL_REACT_RECOMPOSER_4(argsWithParentheses) INTERNAL_REACT_GET_ARG_4 argsWithParentheses

//
// The macros below are internal implementation details for macro defined in nativeModules.h
//

// Register struct as a ReactNative module.
#define INTERNAL_REACT_MODULE_3_ARGS(moduleStruct, moduleName, eventEmitterName)                                    \
  struct moduleStruct;                                                                                              \
                                                                                                                    \
  template <class TDummy>                                                                                           \
  struct moduleStruct##_ModuleRegistration final : winrt::Microsoft::ReactNative::ModuleRegistration {              \
    moduleStruct##_ModuleRegistration() noexcept : winrt::Microsoft::ReactNative::ModuleRegistration{moduleName} {} \
                                                                                                                    \
    winrt::Microsoft::ReactNative::ReactModuleProvider MakeModuleProvider() const noexcept override {               \
      return winrt::Microsoft::ReactNative::MakeModuleProvider<moduleStruct>();                                     \
    }                                                                                                               \
                                                                                                                    \
    static const moduleStruct##_ModuleRegistration Registration;                                                    \
  };                                                                                                                \
                                                                                                                    \
  template <class TDummy>                                                                                           \
  const moduleStruct##_ModuleRegistration<TDummy> moduleStruct##_ModuleRegistration<TDummy>::Registration;          \
  template struct moduleStruct##_ModuleRegistration<int>;                                                           \
                                                                                                                    \
  template <class TRegistry>                                                                                        \
  constexpr void GetReactModuleInfo(moduleStruct *, TRegistry &registry) noexcept {                                 \
    registry.RegisterModule(                                                                                        \
        moduleName, eventEmitterName, winrt::Microsoft::ReactNative::ReactAttributeId<__COUNTER__>{});              \
  }

#define INTERNAL_REACT_MODULE_2_ARGS(moduleStruct, moduleName) \
  INTERNAL_REACT_MODULE_3_ARGS(moduleStruct, moduleName, L"")

#define INTERNAL_REACT_MODULE_1_ARG(moduleStruct) INTERNAL_REACT_MODULE_2_ARGS(moduleStruct, L## #moduleStruct)

#define INTERNAL_REACT_MODULE(...) \
  INTERNAL_REACT_RECOMPOSER_4(     \
      (__VA_ARGS__, INTERNAL_REACT_MODULE_3_ARGS, INTERNAL_REACT_MODULE_2_ARGS, INTERNAL_REACT_MODULE_1_ARG, ))

// Provide meta data information about struct member.
// For each member with a 'custom attribute' macro we create a static method to provide meta data.
// The member Id is generated as a ReactMemberId<__COUNTER__> type.
// To enumerate the static methods, we can increment ReactMemberId while static member exists.
#define INTERNAL_REACT_MEMBER_4_ARGS(memberKind, member, jsMemberName, jsModuleName)                          \
  template <class TStruct, class TVisitor>                                                                    \
  constexpr static void GetReactMemberAttribute(                                                              \
      TVisitor &visitor, winrt::Microsoft::ReactNative::ReactAttributeId<__COUNTER__> attributeId) noexcept { \
    visitor.Visit(                                                                                            \
        &TStruct::member,                                                                                     \
        attributeId,                                                                                          \
        winrt::Microsoft::ReactNative::React##memberKind##Attribute{jsMemberName, jsModuleName});             \
  }

#define INTERNAL_REACT_MEMBER_3_ARGS(memberKind, member, jsMemberName) \
  INTERNAL_REACT_MEMBER_4_ARGS(memberKind, member, jsMemberName, L"")

#define INTERNAL_REACT_MEMBER_2_ARGS(memberKind, member) INTERNAL_REACT_MEMBER_3_ARGS(memberKind, member, L## #member)

#define INTERNAL_REACT_MEMBER(...) \
  INTERNAL_REACT_RECOMPOSER_4(     \
      (__VA_ARGS__, INTERNAL_REACT_MEMBER_4_ARGS, INTERNAL_REACT_MEMBER_3_ARGS, INTERNAL_REACT_MEMBER_2_ARGS, ))

namespace winrt::Microsoft::ReactNative {

struct ModuleRegistration {
  ModuleRegistration(wchar_t const *moduleName) noexcept;

  virtual ReactModuleProvider MakeModuleProvider() const noexcept = 0;

  static ModuleRegistration const *Head() noexcept {
    return s_head;
  }

  ModuleRegistration const *Next() const noexcept {
    return m_next;
  }

  wchar_t const *ModuleName() const noexcept {
    return m_moduleName;
  }

 private:
  wchar_t const *m_moduleName{nullptr};
  ModuleRegistration const *m_next{nullptr};

  static const ModuleRegistration *s_head;
};

void AddAttributedModules(IReactPackageBuilder const &packageBuilder) noexcept;

bool TryAddAttributedModule(IReactPackageBuilder const &packageBuilder, std::wstring_view moduleName) noexcept;

} // namespace winrt::Microsoft::ReactNative
