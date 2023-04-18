// (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.

#pragma once

#include <fb/fbjni.h>
#include <jni.h>
#include <react/common/mapbuffer/JReadableMapBuffer.h>

namespace facebook {
namespace react {

class JReactExceptionManager
    : public facebook::jni::JavaClass<JReactExceptionManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/venice/exceptionmanager/ReactJsExceptionHandler;";

  void reportJsException(const JReadableMapBuffer::javaobject errorMapBuffer);
};

} // namespace react
} // namespace facebook
