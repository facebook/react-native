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

#pragma once
#ifndef MICROSOFT_REACTNATIVE_JSVALUETREEWRITER
#define MICROSOFT_REACTNATIVE_JSVALUETREEWRITER

#include <stack>
#include "JSValue.h"

namespace winrt::Microsoft::ReactNative {

// Writes to a tree of JSValue objects.
struct JSValueTreeWriter : implements<JSValueTreeWriter, IJSValueWriter> {
  JSValueTreeWriter() noexcept;
  JSValue TakeValue() noexcept;

 public: // IJSValueWriter
  void WriteNull() noexcept;
  void WriteBoolean(bool value) noexcept;
  void WriteInt64(int64_t value) noexcept;
  void WriteDouble(double value) noexcept;
  void WriteString(const winrt::hstring &value) noexcept;
  void WriteObjectBegin() noexcept;
  void WritePropertyName(const winrt::hstring &name) noexcept;
  void WriteObjectEnd() noexcept;
  void WriteArrayBegin() noexcept;
  void WriteArrayEnd() noexcept;

 private:
  enum struct ContainerType { None, Object, Array };

  struct ContainerInfo {
    ContainerInfo(ContainerType type) noexcept : Type{std::move(type)} {}

    ContainerType Type{ContainerType::None};
    JSValueObject Object;
    JSValueArray Array;
    std::string PropertyName;
  };

 private:
  void WriteValue(JSValue &&value) noexcept;

 private:
  std::stack<ContainerInfo> m_containerStack;
  JSValue m_resultValue;
};

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_JSVALUETREEWRITER
