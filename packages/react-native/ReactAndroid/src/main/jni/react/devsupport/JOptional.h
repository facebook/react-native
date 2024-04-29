/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

#include <optional>

// TODO(moti): Consider moving this into fbjni

namespace facebook::react {

class JOptionalInt : public facebook::jni::JavaClass<JOptionalInt> {
 public:
  static auto constexpr kJavaDescriptor = "Ljava/util/OptionalInt;";

  int getAsInt() const;
  bool isPresent() const;
  operator std::optional<int>() const;
};

} // namespace facebook::react
