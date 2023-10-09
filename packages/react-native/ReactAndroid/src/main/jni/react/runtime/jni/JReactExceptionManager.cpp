/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactExceptionManager.h"
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>
#include <iostream>

namespace facebook::react {

void JReactExceptionManager::reportJsException(
    const JReadableMapBuffer::javaobject errorMapBuffer) {
  static const auto method =
      javaClassStatic()->getMethod<void(JReadableMapBuffer::javaobject)>(
          "reportJsException");
  if (self() != nullptr) {
    method(self(), errorMapBuffer);
  }
}

} // namespace facebook::react
