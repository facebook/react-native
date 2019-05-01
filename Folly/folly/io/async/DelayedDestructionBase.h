/*
 * Copyright 2015-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <assert.h>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <type_traits>
#include <utility>

#include <boost/noncopyable.hpp>
#include <glog/logging.h>

namespace folly {

/**
 * DelayedDestructionBase is a helper class to ensure objects are not deleted
 * while they still have functions executing in a higher stack frame.
 *
 * This is useful for objects that invoke callback functions, to ensure that a
 * callback does not destroy the calling object.
 *
 * Classes needing this functionality should:
 * - derive from DelayedDestructionBase directly
 * - implement onDelayedDestroy which'll be called before the object is
 *   going to be destructed
 * - create a DestructorGuard object on the stack in each public method that
 *   may invoke a callback
 *
 * DelayedDestructionBase does not perform any locking.  It is intended to be
 * used only from a single thread.
 */
class DelayedDestructionBase : private boost::noncopyable {
 public:
  virtual ~DelayedDestructionBase() = default;

  /**
   * Classes should create a DestructorGuard object on the stack in any
   * function that may invoke callback functions.
   *
   * The DestructorGuard prevents the guarded class from being destroyed while
   * it exists.  Without this, the callback function could delete the guarded
   * object, causing problems when the callback function returns and the
   * guarded object's method resumes execution.
   */
  class DestructorGuard {
   public:
    explicit DestructorGuard(DelayedDestructionBase* dd) : dd_(dd) {
      if (dd_ != nullptr) {
        ++dd_->guardCount_;
        assert(dd_->guardCount_ > 0); // check for wrapping
      }
    }

    DestructorGuard(const DestructorGuard& dg) : DestructorGuard(dg.dd_) {}

    DestructorGuard(DestructorGuard&& dg) noexcept
        : dd_(std::exchange(dg.dd_, nullptr)) {}

    DestructorGuard& operator=(DestructorGuard dg) noexcept {
      std::swap(dd_, dg.dd_);
      return *this;
    }

    DestructorGuard& operator=(DelayedDestructionBase* dd) {
      *this = DestructorGuard(dd);
      return *this;
    }

    ~DestructorGuard() {
      if (dd_ != nullptr) {
        assert(dd_->guardCount_ > 0);
        --dd_->guardCount_;
        if (dd_->guardCount_ == 0) {
          dd_->onDelayedDestroy(true);
        }
      }
    }

    DelayedDestructionBase* get() const {
      return dd_;
    }

    explicit operator bool() const {
      return dd_ != nullptr;
    }

   private:
    DelayedDestructionBase* dd_;
  };

  /**
   * This smart pointer is a convenient way to manage a concrete
   * DelayedDestructorBase child. It can replace the equivalent raw pointer and
   * provide automatic memory management.
   */
  template <typename AliasType>
  class IntrusivePtr : private DestructorGuard {
    template <typename CopyAliasType>
    friend class IntrusivePtr;

   public:
    template <typename... Args>
    static IntrusivePtr<AliasType> make(Args&&... args) {
      return {new AliasType(std::forward<Args>(args)...)};
    }

    IntrusivePtr() = default;
    IntrusivePtr(const IntrusivePtr&) = default;
    IntrusivePtr(IntrusivePtr&&) noexcept = default;

    template <
        typename CopyAliasType,
        typename = typename std::enable_if<
            std::is_convertible<CopyAliasType*, AliasType*>::value>::type>
    IntrusivePtr(const IntrusivePtr<CopyAliasType>& copy)
        : DestructorGuard(copy) {}

    template <
        typename CopyAliasType,
        typename = typename std::enable_if<
            std::is_convertible<CopyAliasType*, AliasType*>::value>::type>
    IntrusivePtr(IntrusivePtr<CopyAliasType>&& copy)
        : DestructorGuard(std::move(copy)) {}

    explicit IntrusivePtr(AliasType* dd) : DestructorGuard(dd) {}

    // Copying from a unique_ptr is safe because if the upcast to
    // DelayedDestructionBase works, then the instance is already using
    // intrusive ref-counting.
    template <
        typename CopyAliasType,
        typename Deleter,
        typename = typename std::enable_if<
            std::is_convertible<CopyAliasType*, AliasType*>::value>::type>
    explicit IntrusivePtr(const std::unique_ptr<CopyAliasType, Deleter>& copy)
        : DestructorGuard(copy.get()) {}

    IntrusivePtr& operator=(const IntrusivePtr&) = default;
    IntrusivePtr& operator=(IntrusivePtr&&) noexcept = default;

    template <
        typename CopyAliasType,
        typename = typename std::enable_if<
            std::is_convertible<CopyAliasType*, AliasType*>::value>::type>
    IntrusivePtr& operator=(IntrusivePtr<CopyAliasType> copy) noexcept {
      DestructorGuard::operator=(copy);
      return *this;
    }

    IntrusivePtr& operator=(AliasType* dd) {
      DestructorGuard::operator=(dd);
      return *this;
    }

    void reset(AliasType* dd = nullptr) {
      *this = dd;
    }

    AliasType* get() const {
      return static_cast<AliasType*>(DestructorGuard::get());
    }

    AliasType& operator*() const {
      return *get();
    }

    AliasType* operator->() const {
      return get();
    }

    explicit operator bool() const {
      return DestructorGuard::operator bool();
    }
  };

 protected:
  DelayedDestructionBase() : guardCount_(0) {}

  /**
   * Get the number of DestructorGuards currently protecting this object.
   *
   * This is primarily intended for debugging purposes, such as asserting
   * that an object has at least 1 guard.
   */
  uint32_t getDestructorGuardCount() const {
    return guardCount_;
  }

  /**
   * Implement onDelayedDestroy in subclasses.
   * onDelayedDestroy() is invoked when the object is potentially being
   * destroyed.
   *
   * @param delayed  This parameter is true if destruction was delayed because
   *                 of a DestructorGuard object, or false if onDelayedDestroy()
   *                 is being called directly from the destructor.
   */
  virtual void onDelayedDestroy(bool delayed) = 0;

 private:
  /**
   * guardCount_ is incremented by DestructorGuard, to indicate that one of
   * the DelayedDestructionBase object's methods is currently running.
   *
   * If the destructor is called while guardCount_ is non-zero, destruction
   * will be delayed until guardCount_ drops to 0.  This allows
   * DelayedDestructionBase objects to invoke callbacks without having to worry
   * about being deleted before the callback returns.
   */
  uint32_t guardCount_;
};

inline bool operator==(
    const DelayedDestructionBase::DestructorGuard& left,
    const DelayedDestructionBase::DestructorGuard& right) {
  return left.get() == right.get();
}
inline bool operator!=(
    const DelayedDestructionBase::DestructorGuard& left,
    const DelayedDestructionBase::DestructorGuard& right) {
  return left.get() != right.get();
}
inline bool operator==(
    const DelayedDestructionBase::DestructorGuard& left,
    std::nullptr_t) {
  return left.get() == nullptr;
}
inline bool operator==(
    std::nullptr_t,
    const DelayedDestructionBase::DestructorGuard& right) {
  return nullptr == right.get();
}
inline bool operator!=(
    const DelayedDestructionBase::DestructorGuard& left,
    std::nullptr_t) {
  return left.get() != nullptr;
}
inline bool operator!=(
    std::nullptr_t,
    const DelayedDestructionBase::DestructorGuard& right) {
  return nullptr != right.get();
}

template <typename LeftAliasType, typename RightAliasType>
inline bool operator==(
    const DelayedDestructionBase::IntrusivePtr<LeftAliasType>& left,
    const DelayedDestructionBase::IntrusivePtr<RightAliasType>& right) {
  return left.get() == right.get();
}
template <typename LeftAliasType, typename RightAliasType>
inline bool operator!=(
    const DelayedDestructionBase::IntrusivePtr<LeftAliasType>& left,
    const DelayedDestructionBase::IntrusivePtr<RightAliasType>& right) {
  return left.get() != right.get();
}
template <typename LeftAliasType>
inline bool operator==(
    const DelayedDestructionBase::IntrusivePtr<LeftAliasType>& left,
    std::nullptr_t) {
  return left.get() == nullptr;
}
template <typename RightAliasType>
inline bool operator==(
    std::nullptr_t,
    const DelayedDestructionBase::IntrusivePtr<RightAliasType>& right) {
  return nullptr == right.get();
}
template <typename LeftAliasType>
inline bool operator!=(
    const DelayedDestructionBase::IntrusivePtr<LeftAliasType>& left,
    std::nullptr_t) {
  return left.get() != nullptr;
}
template <typename RightAliasType>
inline bool operator!=(
    std::nullptr_t,
    const DelayedDestructionBase::IntrusivePtr<RightAliasType>& right) {
  return nullptr != right.get();
}
} // namespace folly
