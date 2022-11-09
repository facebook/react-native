/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Bridging.h>
#include <optional>
#include <string>

namespace facebook::react {

struct ConstantsStruct {
  bool const1;
  int32_t const2;
  std::string const3;
  bool operator==(const ConstantsStruct &other) const {
    return const1 == other.const1 && const2 == other.const2 &&
        const3 == other.const3;
  }
};

template <>
struct Bridging<ConstantsStruct> {
  static jsi::Object toJs(jsi::Runtime &rt, const ConstantsStruct &value) {
    auto result = facebook::jsi::Object(rt);
    result.setProperty(rt, "const1", bridging::toJs(rt, value.const1));
    result.setProperty(rt, "const2", bridging::toJs(rt, value.const2));
    result.setProperty(rt, "const3", bridging::toJs(rt, value.const3));
    return result;
  }
};

} // namespace facebook::react
