/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <functional>
#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * Takes a function and calls it when it is safe to access the Self&
 * parameter without locking. The function is not called if
 * the underlying Self object is destroyed while the function is pending.
 */
template <typename Self>
using ScopedExecutor =
    std::function<void(std::function<void(Self& self)>&& callback)>;

using VoidExecutor = std::function<void(std::function<void()>&& callback)>;

/**
 * Creates a ScopedExecutor<Self> from a shared (weak) pointer to Self plus some
 * base executor for a "parent" object of Self. The resulting executor will call
 * the callback with a valid reference to Self iff Self is still alive.
 */
template <typename Self, typename Parent>
ScopedExecutor<Self> makeScopedExecutor(
    std::shared_ptr<Self> self,
    ScopedExecutor<Parent> executor) {
  return makeScopedExecutor(self, makeVoidExecutor(executor));
}

/**
 * Creates a ScopedExecutor<Self> from a shared (weak) pointer to Self plus some
 * base executor. The resulting executor will call the callback with a valid
 * reference to Self iff Self is still alive.
 */
template <typename Self>
ScopedExecutor<Self> makeScopedExecutor(
    std::shared_ptr<Self> self,
    VoidExecutor executor) {
  return [self = std::weak_ptr(self), executor](auto&& callback) {
    executor([self, callback = std::move(callback)]() {
      auto lockedSelf = self.lock();
      if (!lockedSelf) {
        return;
      }
      callback(*lockedSelf);
    });
  };
}

/**
 * Creates a VoidExecutor from a ScopedExecutor<Self> by ignoring the Self&
 * parameter.
 */
template <typename Self>
VoidExecutor makeVoidExecutor(ScopedExecutor<Self> executor) {
  return [executor](auto&& callback) {
    executor([callback = std::move(callback)](Self&) { callback(); });
  };
}

template <typename Self>
class EnableExecutorFromThis : public std::enable_shared_from_this<Self> {
 public:
  /**
   * Returns an executor that can be used to safely invoke methods on Self.
   * Must not be called during the constructor of Self.
   */
  ScopedExecutor<Self> executorFromThis() {
    assert(baseExecutor_);
    return makeScopedExecutor(this->shared_from_this(), baseExecutor_);
  }

  template <typename Other>
  void setExecutor(ScopedExecutor<Other> executor) {
    setExecutor(makeVoidExecutor(executor));
  }

  void setExecutor(VoidExecutor executor) {
    assert(executor);
    assert(!baseExecutor_);
    baseExecutor_ = std::move(executor);
  }

 private:
  VoidExecutor baseExecutor_;
};

} // namespace facebook::react::jsinspector_modern
