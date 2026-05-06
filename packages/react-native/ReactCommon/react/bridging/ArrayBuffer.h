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
struct Bridging<jsi::ArrayBuffer> {
  static jsi::ArrayBuffer fromJs(jsi::Runtime &rt, const jsi::Object &obj)
  {
    if (!obj.isArrayBuffer(rt)) {
      throw jsi::JSError(rt, "Expected ArrayBuffer");
    }
    return obj.getArrayBuffer(rt);
  }

  static jsi::Value toJs(jsi::Runtime &rt, jsi::ArrayBuffer buf)
  {
    return jsi::Value(rt, std::move(buf));
  }
};

} // namespace facebook::react
