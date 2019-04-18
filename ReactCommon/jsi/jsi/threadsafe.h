/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <mutex>

#include <jsi/decorator.h>
#include <jsi/jsi.h>

namespace facebook {
namespace jsi {

class ThreadSafeRuntime : public Runtime {
 public:
  virtual void lock() const = 0;
  virtual void unlock() const = 0;
  virtual Runtime& getUnsafeRuntime() = 0;
};

namespace detail {

template <typename R, typename L>
struct WithLock {
  L lock;
  WithLock(R& r) : lock(r) {}
  void before() {
    lock.lock();
  }
  void after() {
    lock.unlock();
  }
};

// The actual implementation of a given ThreadSafeRuntime. It's parameterized
// by:
//
// - R: The actual Runtime type that this wraps
// - L: A lock type that has three members:
//   - L(R& r)       // ctor
//   - void lock()
//   - void unlock()
template <typename R, typename L>
class ThreadSafeRuntimeImpl final
    : public WithRuntimeDecorator<WithLock<R, L>, R, ThreadSafeRuntime> {
 public:
  template <typename... Args>
  ThreadSafeRuntimeImpl(Args&&... args)
      : WithRuntimeDecorator<WithLock<R, L>, R, ThreadSafeRuntime>(
            unsafe_,
            lock_),
        unsafe_(std::forward<Args>(args)...),
        lock_(unsafe_) {}

  R& getUnsafeRuntime() override {
    return WithRuntimeDecorator<WithLock<R, L>, R, ThreadSafeRuntime>::plain();
  }

  void lock() const override {
    lock_.before();
  }

  void unlock() const override {
    lock_.after();
  }

 private:
  R unsafe_;
  mutable WithLock<R, L> lock_;
};

} // namespace detail

} // namespace jsi
} // namespace facebook
