/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/graphics/Size.h>

namespace facebook::react {

class JReactModalHostView
    : public facebook::jni::JavaClass<JReactModalHostView> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/views/modal/ReactModalHostView;";

  static Size getDisplayMetrics() {
    static auto method =
        JReactModalHostView::javaClassStatic()->getStaticMethod<jlong()>(
            "getScreenDisplayMetricsWithoutInsets");
    auto result = method(javaClassStatic());

    // Inspired from yogaMeassureToSize from conversions.h
    int32_t wBits = 0xFFFFFFFF & (result >> 32);
    int32_t hBits = 0xFFFFFFFF & result;

    auto* measuredWidth = reinterpret_cast<float*>(&wBits);
    auto* measuredHeight = reinterpret_cast<float*>(&hBits);

    return Size{.width = *measuredWidth, .height = *measuredHeight};
  }
};

} // namespace facebook::react
