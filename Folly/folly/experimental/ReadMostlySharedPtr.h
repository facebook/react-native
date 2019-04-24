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
/* -*- Mode: C++; tab-width: 2; c-basic-offset: 2; indent-tabs-mode: nil -*- */
#pragma once

#include <atomic>

#include <folly/experimental/TLRefCount.h>

namespace folly {

template <typename T, typename RefCount>
class ReadMostlyMainPtr;
template <typename T, typename RefCount>
class ReadMostlyWeakPtr;
template <typename T, typename RefCount>
class ReadMostlySharedPtr;
template <typename RefCount>
class ReadMostlyMainPtrDeleter;

using DefaultRefCount = TLRefCount;

namespace detail {

template <typename T, typename RefCount = DefaultRefCount>
class ReadMostlySharedPtrCore {
 public:
  T* get() {
    return ptrRaw_;
  }

  std::shared_ptr<T> getShared() {
    return ptr_;
  }

  bool incref() {
    return ++count_ > 0;
  }

  void decref() {
    if (--count_ == 0) {
      ptrRaw_ = nullptr;
      ptr_.reset();

      decrefWeak();
    }
  }

  void increfWeak() {
    auto value = ++weakCount_;
    DCHECK_GT(value, 0);
  }

  void decrefWeak() {
    if (--weakCount_ == 0) {
      delete this;
    }
  }

  size_t useCount() const {
    return *count_;
  }

  ~ReadMostlySharedPtrCore() noexcept {
    assert(*count_ == 0);
    assert(*weakCount_ == 0);
  }

 private:
  friend class ReadMostlyMainPtr<T, RefCount>;
  friend class ReadMostlyMainPtrDeleter<RefCount>;

  explicit ReadMostlySharedPtrCore(std::shared_ptr<T> ptr)
      : ptrRaw_(ptr.get()), ptr_(std::move(ptr)) {}

  T* ptrRaw_;
  RefCount count_;
  RefCount weakCount_;
  std::shared_ptr<T> ptr_;
};

} // namespace detail

template <typename T, typename RefCount = DefaultRefCount>
class ReadMostlyMainPtr {
 public:
  ReadMostlyMainPtr() {}

  explicit ReadMostlyMainPtr(std::shared_ptr<T> ptr) {
    reset(std::move(ptr));
  }

  ReadMostlyMainPtr(const ReadMostlyMainPtr&) = delete;
  ReadMostlyMainPtr& operator=(const ReadMostlyMainPtr&) = delete;

  ReadMostlyMainPtr(ReadMostlyMainPtr&& other) noexcept {
    *this = std::move(other);
  }

  ReadMostlyMainPtr& operator=(ReadMostlyMainPtr&& other) noexcept {
    std::swap(impl_, other.impl_);

    return *this;
  }

  bool operator==(const ReadMostlyMainPtr<T, RefCount>& other) const {
    return get() == other.get();
  }

  bool operator==(T* other) const {
    return get() == other;
  }

  bool operator==(const ReadMostlySharedPtr<T, RefCount>& other) const {
    return get() == other.get();
  }

  ~ReadMostlyMainPtr() noexcept {
    reset();
  }

  void reset() noexcept {
    if (impl_) {
      impl_->count_.useGlobal();
      impl_->weakCount_.useGlobal();
      impl_->decref();
      impl_ = nullptr;
    }
  }

  void reset(std::shared_ptr<T> ptr) {
    reset();
    if (ptr) {
      impl_ = new detail::ReadMostlySharedPtrCore<T, RefCount>(std::move(ptr));
    }
  }

  T* get() const {
    if (impl_) {
      return impl_->ptrRaw_;
    } else {
      return nullptr;
    }
  }

  std::shared_ptr<T> getStdShared() const {
    if (impl_) {
      return impl_->getShared();
    } else {
      return {};
    }
  }

  T& operator*() const {
    return *get();
  }

  T* operator->() const {
    return get();
  }

  ReadMostlySharedPtr<T, RefCount> getShared() const {
    return ReadMostlySharedPtr<T, RefCount>(*this);
  }

  explicit operator bool() const {
    return impl_ != nullptr;
  }

 private:
  friend class ReadMostlyWeakPtr<T, RefCount>;
  friend class ReadMostlySharedPtr<T, RefCount>;
  friend class ReadMostlyMainPtrDeleter<RefCount>;

  detail::ReadMostlySharedPtrCore<T, RefCount>* impl_{nullptr};
};

template <typename T, typename RefCount = DefaultRefCount>
class ReadMostlyWeakPtr {
 public:
  ReadMostlyWeakPtr() {}

  explicit ReadMostlyWeakPtr(const ReadMostlyMainPtr<T, RefCount>& mainPtr) {
    reset(mainPtr.impl_);
  }

  explicit ReadMostlyWeakPtr(const ReadMostlySharedPtr<T, RefCount>& ptr) {
    reset(ptr.impl_);
  }

  ReadMostlyWeakPtr(const ReadMostlyWeakPtr& other) {
    *this = other;
  }

  ReadMostlyWeakPtr& operator=(const ReadMostlyWeakPtr& other) {
    reset(other.impl_);
    return *this;
  }

  ReadMostlyWeakPtr& operator=(const ReadMostlyMainPtr<T, RefCount>& mainPtr) {
    reset(mainPtr.impl_);
    return *this;
  }

  ReadMostlyWeakPtr(ReadMostlyWeakPtr&& other) noexcept {
    *this = other;
  }

  ReadMostlyWeakPtr& operator=(ReadMostlyWeakPtr&& other) noexcept {
    std::swap(impl_, other.impl_);
    return *this;
  }

  ~ReadMostlyWeakPtr() noexcept {
    reset(nullptr);
  }

  ReadMostlySharedPtr<T, RefCount> lock() {
    return ReadMostlySharedPtr<T, RefCount>(*this);
  }

 private:
  friend class ReadMostlySharedPtr<T, RefCount>;

  void reset(detail::ReadMostlySharedPtrCore<T, RefCount>* impl) {
    if (impl_) {
      impl_->decrefWeak();
    }
    impl_ = impl;
    if (impl_) {
      impl_->increfWeak();
    }
  }

  detail::ReadMostlySharedPtrCore<T, RefCount>* impl_{nullptr};
};

template <typename T, typename RefCount = DefaultRefCount>
class ReadMostlySharedPtr {
 public:
  ReadMostlySharedPtr() {}

  explicit ReadMostlySharedPtr(const ReadMostlyWeakPtr<T, RefCount>& weakPtr) {
    reset(weakPtr.impl_);
  }

  // Generally, this shouldn't be used.
  explicit ReadMostlySharedPtr(const ReadMostlyMainPtr<T, RefCount>& mainPtr) {
    reset(mainPtr.impl_);
  }

  ReadMostlySharedPtr(const ReadMostlySharedPtr& other) {
    *this = other;
  }

  ReadMostlySharedPtr& operator=(const ReadMostlySharedPtr& other) {
    reset(other.impl_);
    return *this;
  }

  ReadMostlySharedPtr& operator=(const ReadMostlyWeakPtr<T, RefCount>& other) {
    reset(other.impl_);
    return *this;
  }

  ReadMostlySharedPtr& operator=(const ReadMostlyMainPtr<T, RefCount>& other) {
    reset(other.impl_);
    return *this;
  }

  ReadMostlySharedPtr(ReadMostlySharedPtr&& other) noexcept {
    *this = std::move(other);
  }

  ~ReadMostlySharedPtr() noexcept {
    reset(nullptr);
  }

  ReadMostlySharedPtr& operator=(ReadMostlySharedPtr&& other) noexcept {
    std::swap(ptr_, other.ptr_);
    std::swap(impl_, other.impl_);
    return *this;
  }

  bool operator==(const ReadMostlyMainPtr<T, RefCount>& other) const {
    return get() == other.get();
  }

  bool operator==(T* other) const {
    return get() == other;
  }

  bool operator==(const ReadMostlySharedPtr<T, RefCount>& other) const {
    return get() == other.get();
  }

  void reset() {
    reset(nullptr);
  }

  T* get() const {
    return ptr_;
  }

  std::shared_ptr<T> getStdShared() const {
    if (impl_) {
      return impl_->getShared();
    } else {
      return {};
    }
  }

  T& operator*() const {
    return *get();
  }

  T* operator->() const {
    return get();
  }

  size_t use_count() const {
    return impl_->useCount();
  }

  bool unique() const {
    return use_count() == 1;
  }

  explicit operator bool() const {
    return impl_ != nullptr;
  }

 private:
  friend class ReadMostlyWeakPtr<T, RefCount>;

  void reset(detail::ReadMostlySharedPtrCore<T, RefCount>* impl) {
    if (impl_) {
      impl_->decref();
      impl_ = nullptr;
      ptr_ = nullptr;
    }

    if (impl && impl->incref()) {
      impl_ = impl;
      ptr_ = impl->get();
    }
  }

  T* ptr_{nullptr};
  detail::ReadMostlySharedPtrCore<T, RefCount>* impl_{nullptr};
};

/**
 * This can be used to destroy multiple ReadMostlyMainPtrs at once.
 */
template <typename RefCount = DefaultRefCount>
class ReadMostlyMainPtrDeleter {
 public:
  ~ReadMostlyMainPtrDeleter() noexcept {
    RefCount::useGlobal(refCounts_);
    for (auto& decref : decrefs_) {
      decref();
    }
  }

  template <typename T>
  void add(ReadMostlyMainPtr<T, RefCount> ptr) noexcept {
    if (!ptr.impl_) {
      return;
    }

    refCounts_.push_back(&ptr.impl_->count_);
    refCounts_.push_back(&ptr.impl_->weakCount_);
    decrefs_.push_back([impl = ptr.impl_] { impl->decref(); });
    ptr.impl_ = nullptr;
  }

 private:
  std::vector<RefCount*> refCounts_;
  std::vector<folly::Function<void()>> decrefs_;
};

template <typename T, typename RefCount>
inline bool operator==(
    const ReadMostlyMainPtr<T, RefCount>& ptr,
    std::nullptr_t) {
  return ptr.get() == nullptr;
}

template <typename T, typename RefCount>
inline bool operator==(
    std::nullptr_t,
    const ReadMostlyMainPtr<T, RefCount>& ptr) {
  return ptr.get() == nullptr;
}

template <typename T, typename RefCount>
inline bool operator==(
    const ReadMostlySharedPtr<T, RefCount>& ptr,
    std::nullptr_t) {
  return ptr.get() == nullptr;
}

template <typename T, typename RefCount>
inline bool operator==(
    std::nullptr_t,
    const ReadMostlySharedPtr<T, RefCount>& ptr) {
  return ptr.get() == nullptr;
}

template <typename T, typename RefCount>
inline bool operator!=(
    const ReadMostlyMainPtr<T, RefCount>& ptr,
    std::nullptr_t) {
  return !(ptr == nullptr);
}

template <typename T, typename RefCount>
inline bool operator!=(
    std::nullptr_t,
    const ReadMostlyMainPtr<T, RefCount>& ptr) {
  return !(ptr == nullptr);
}

template <typename T, typename RefCount>
inline bool operator!=(
    const ReadMostlySharedPtr<T, RefCount>& ptr,
    std::nullptr_t) {
  return !(ptr == nullptr);
}

template <typename T, typename RefCount>
inline bool operator!=(
    std::nullptr_t,
    const ReadMostlySharedPtr<T, RefCount>& ptr) {
  return !(ptr == nullptr);
}
} // namespace folly
