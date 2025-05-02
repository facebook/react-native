/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/graphics/Size.h>

#include <android/log.h>

namespace facebook::react {

class JReactModalHostView
    : public facebook::jni::JavaClass<JReactModalHostView> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/views/modal/ReactModalHostView;";

  static Size getDisplayMetrics() {
    static auto method = JReactModalHostView::javaClassStatic()
                             ->getStaticMethod<jni::JArrayFloat()>(
                                 "getScreenDisplayMetricsWithoutInsets");
    auto result = method(javaClassStatic());
    size_t size = result->size();
    std::vector<jfloat> elements(size + 1L);
    result->getRegion(0, size, elements.data());
    return Size{elements[0], elements[1]};
  }
};

} // namespace facebook::react
