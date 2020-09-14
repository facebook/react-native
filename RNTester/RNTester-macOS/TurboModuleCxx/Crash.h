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
