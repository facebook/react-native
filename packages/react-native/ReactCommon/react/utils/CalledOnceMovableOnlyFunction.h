/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <functional>

#include <react/debug/react_native_assert.h>

namespace facebook::react {

/*
 * Implements a moveable-only function that asserts if called more than once
 * or destroyed before calling.
 * Useful for use in debug mode to ensure such guarantees.
 */
template <typename ReturnT = void, typename... ArgumentT>
class CalledOnceMovableOnlyFunction {
  using T = ReturnT(ArgumentT...);

  std::function<T> function_;
  bool wasCalled_;
  bool wasMovedFrom_;

 public:
  explicit CalledOnceMovableOnlyFunction(std::function<T>&& function)
      : function_(std::move(function)) {
    wasCalled_ = false;
    wasMovedFrom_ = false;
  }

  ~CalledOnceMovableOnlyFunction() {
    react_native_assert(
        (wasCalled_ || wasMovedFrom_) &&
        "`CalledOnceMovableOnlyFunction` is destroyed before being called.");
  }

  /*
   * Not copyable.
   */
  CalledOnceMovableOnlyFunction(const CalledOnceMovableOnlyFunction& other) =
      delete;
  CalledOnceMovableOnlyFunction& operator=(
      const CalledOnceMovableOnlyFunction& other) = delete;

  /*
   * Movable.
   */
  CalledOnceMovableOnlyFunction(
      CalledOnceMovableOnlyFunction&& other) noexcept {
    wasCalled_ = false;
    wasMovedFrom_ = false;
    other.wasMovedFrom_ = true;
    function_ = std::move(other.function_);
  };

  CalledOnceMovableOnlyFunction& operator=(
      CalledOnceMovableOnlyFunction&& other) noexcept {
    react_native_assert(
        (wasCalled_ || wasMovedFrom_) &&
        "`CalledOnceMovableOnlyFunction` is re-assigned before being called.");
    wasCalled_ = false;
    wasMovedFrom_ = false;
    other.wasMovedFrom_ = true;
    function_ = std::move(other.function_);
    return *this;
  }

  /*
   * Callable.
   */
  ReturnT operator()(ArgumentT... args) {
    react_native_assert(
        !wasMovedFrom_ &&
        "`CalledOnceMovableOnlyFunction` is called after being moved from.");
    react_native_assert(
        !wasCalled_ &&
        "`CalledOnceMovableOnlyFunction` is called more than once.");

    wasCalled_ = true;
    return function_(args...);
  }
};

} // namespace facebook::react
