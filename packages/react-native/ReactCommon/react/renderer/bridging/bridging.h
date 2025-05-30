/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/bridging/Base.h>
#include <react/renderer/core/ShadowNode.h>

namespace facebook::react {

template <>
struct Bridging<ShadowNode::Shared> {
  static ShadowNode::Shared fromJs(
      jsi::Runtime& rt,
      const jsi::Value& jsiValue) {
    auto object = jsiValue.asObject(rt);

    // Using `jsi::NativeState` instead of `ShadowNodeWrapper` to avoid  doing a
    // dynamic pointer cast twice (as we're calling `hasNativeState` and then
    // `getNativeState`). When we use `NativeState`, JSI doesn't need to do any
    // dynamic casts and we can do a single one on our own after the checks.
    if (!object.hasNativeState<jsi::NativeState>(rt)) {
      throw jsi::JSINativeException("Value is not a ShadowNode reference");
    }

    auto nativeState = object.getNativeState<jsi::NativeState>(rt);
    auto shadowNodeWrapper =
        std::dynamic_pointer_cast<ShadowNodeWrapper>(nativeState);
    if (shadowNodeWrapper == nullptr ||
        shadowNodeWrapper->shadowNode == nullptr) {
      throw jsi::JSINativeException(
          "Value state is nullptr, expected a ShadowNode reference");
    }

    return shadowNodeWrapper->shadowNode;
  }

  static jsi::Value toJs(jsi::Runtime& rt, const ShadowNode::Shared& value) {
    jsi::Object obj(rt);
    obj.setNativeState(rt, std::make_shared<ShadowNodeWrapper>(value));
    return obj;
  }
};

} // namespace facebook::react
