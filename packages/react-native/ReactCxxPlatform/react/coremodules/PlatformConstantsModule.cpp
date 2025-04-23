/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PlatformConstantsModule.h"

namespace facebook::react {

PlatformConstantsAndroid PlatformConstantsModule::getConstants(
    jsi::Runtime& /*rt*/) {
  return PlatformConstantsAndroid{
      .isTesting = false,
      .isDisableAnimations = false,
      .reactNativeVersion =
          {
              .major = 1000,
              .minor = 0,
              .patch = 0,
              .prerelease = std::nullopt,
          },
      .Version = 33, // Android 13 (API level 33)
      .Release = "",
      .Fingerprint = "",
      .Model = "",
      .ServerHost = "",
      .uiMode = "",
      .Brand = "",
      .Manufacturer = "",
  };
}

} // namespace facebook::react
