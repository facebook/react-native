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

struct ObjectStruct {
  int32_t a;
  std::string b;
  std::optional<std::string> c;
  bool operator==(const ObjectStruct &other) const {
    return a == other.a && b == other.b && c == other.c;
  }
};

template <>
struct Bridging<ObjectStruct> {
  static ObjectStruct fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    ObjectStruct result{
        bridging::fromJs<int32_t>(rt, value.getProperty(rt, "a"), jsInvoker),
        bridging::fromJs<std::string>(
            rt, value.getProperty(rt, "b"), jsInvoker),
        bridging::fromJs<std::optional<std::string>>(
            rt, value.getProperty(rt, "c"), jsInvoker)};

    return result;
  }

  static jsi::Object toJs(jsi::Runtime &rt, const ObjectStruct &value) {
    auto result = facebook::jsi::Object(rt);
    result.setProperty(rt, "a", bridging::toJs(rt, value.a));
    result.setProperty(rt, "b", bridging::toJs(rt, value.b));
    if (value.c) {
      result.setProperty(rt, "c", bridging::toJs(rt, value.c.value()));
    }
    return result;
  }
};

} // namespace facebook::react
