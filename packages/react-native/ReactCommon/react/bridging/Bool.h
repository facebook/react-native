/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

namespace facebook::react {

template <>
struct Bridging<bool> {
  static bool fromJs(jsi::Runtime& rt, const jsi::Value& value) {
    return value.asBool();
  }

  static jsi::Value toJs(jsi::Runtime&, bool value) {
    return value;
  }
};

} // namespace facebook::react
