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
#include "NativeCxxModuleExample_ObjectStruct.h"

namespace facebook::react {

struct ValueStruct {
  double x;
  std::string y;
  ObjectStruct z;
  bool operator==(const ValueStruct &other) const {
    return x == other.x && y == other.y && z == other.z;
  }
};

template <>
struct Bridging<ValueStruct> {
  static ValueStruct fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    ValueStruct result{
        bridging::fromJs<double>(rt, value.getProperty(rt, "x"), jsInvoker),
        bridging::fromJs<std::string>(
            rt, value.getProperty(rt, "y"), jsInvoker),
        bridging::fromJs<ObjectStruct>(
            rt, value.getProperty(rt, "z"), jsInvoker)};
    return result;
  }

  static jsi::Object toJs(jsi::Runtime &rt, const ValueStruct &value) {
    auto result = facebook::jsi::Object(rt);
    result.setProperty(rt, "x", bridging::toJs(rt, value.x));
    result.setProperty(rt, "y", bridging::toJs(rt, value.y));
    result.setProperty(rt, "z", bridging::toJs(rt, value.z));
    return result;
  }
};

} // namespace facebook::react
