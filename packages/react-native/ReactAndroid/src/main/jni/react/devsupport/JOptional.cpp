/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JOptional.h"

namespace facebook::react {

int JOptionalInt::getAsInt() const {
  static auto method = javaClassStatic()->getMethod<jint()>("getAsInt");
  return method(self());
}

bool JOptionalInt::isPresent() const {
  static auto method = javaClassStatic()->getMethod<jboolean()>("isPresent");
  return method(self());
}

JOptionalInt::operator std::optional<int>() const {
  if (!isPresent()) {
    return {};
  }
  return getAsInt();
}

} // namespace facebook::react
