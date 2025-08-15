/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DeviceInfoModule.h"

namespace facebook::react {

DeviceInfoConstants DeviceInfoModule::getConstants(jsi::Runtime& /*rt*/) {
  // TODO: Wire this to come from the actual app
  // size (T161837708)
  return DeviceInfoConstants{
      .Dimensions =
          {.window =
               DisplayMetrics{
                   1280,
                   720,
               }},
  };
}

} // namespace facebook::react
