/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fb/fbjni.h>
#include <jni.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>

namespace facebook::react {

class JReactExceptionManager
    : public facebook::jni::JavaClass<JReactExceptionManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/runtime/exceptionmanager/ReactJsExceptionHandler;";

  void reportJsException(const JReadableMapBuffer::javaobject errorMapBuffer);
};

} // namespace facebook::react
