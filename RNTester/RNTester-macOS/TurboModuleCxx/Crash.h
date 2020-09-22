// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once

#ifndef VerifyElseCrash
#define VerifyElseCrash(condition) \
  do {                             \
    if (!(condition)) {            \
      assert(false && #condition); \
      std::terminate();            \
    }                              \
  } while (false)
#endif

#ifndef VerifyElseCrashSz
#define VerifyElseCrashSz(condition, message) \
  do {                                        \
    if (!(condition)) {                       \
      assert(false && (message));             \
      std::terminate();                       \
    }                                         \
  } while (false)
#endif
