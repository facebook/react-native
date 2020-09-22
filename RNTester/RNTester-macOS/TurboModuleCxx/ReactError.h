// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#include "JSValue.h"

namespace winrt::Microsoft::ReactNative {

struct ReactError {
  std::string Code;
  std::string Message;
  JSValueObject UserInfo;
};

} // namespace winrt::Microsoft::ReactNative
