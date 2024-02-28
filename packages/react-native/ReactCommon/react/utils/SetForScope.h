/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

namespace facebook::react {

template <typename T>
class SetForScope {
 public:
  explicit SetForScope(T& variable)
      : variable_(variable), valueToRestore_(variable) {}

  template <typename U>
  SetForScope(T& variable, U&& newValue) : SetForScope(variable) {
    variable_ = std::forward<U>(newValue);
  }

  template <typename U, typename V>
  SetForScope(T& variable, U&& newValue, V&& valueToRestore)
      : variable_(variable), valueToRestore_(std::forward<V>(valueToRestore)) {
    variable_ = std::forward<U>(newValue);
  }

  // Non-movable
  SetForScope(const SetForScope&) = delete;
  SetForScope(SetForScope&&) = delete;

  // Non-copyable
  SetForScope& operator=(const SetForScope&) = delete;
  SetForScope& operator=(SetForScope&&) = delete;

  ~SetForScope() {
    variable_ = std::move(valueToRestore_);
  }

 private:
  T& variable_;
  T valueToRestore_;
};

} // namespace facebook::react
