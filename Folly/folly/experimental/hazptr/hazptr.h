/*
 * Copyright 2016-present Facebook, Inc.
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
#define HAZPTR_H

#include <atomic>

/* Stand-in for C++17 std::pmr::memory_resource */
#include <folly/experimental/hazptr/memory_resource.h>

namespace folly {
namespace hazptr {

/** hazptr_rec: Private class that contains hazard pointers. */
class hazptr_rec;

/** hazptr_obj: Private class for objects protected by hazard pointers. */
class hazptr_obj;

/** hazptr_obj_base: Base template for objects protected by hazard pointers. */
template <typename T, typename Deleter>
class hazptr_obj_base;

/** hazptr_obj_base_refcounted:
 *  Base template for reference counted objects protected by hazard pointers.
 */
template <typename T, typename Deleter>
class hazptr_obj_base_refcounted;

/** hazptr_local: Optimized template for bulk construction and destruction of
 *  hazard pointers */
template <size_t M>
class hazptr_array;

/** hazptr_local: Optimized template for locally-used hazard pointers */
template <size_t M>
class hazptr_local;

/** hazptr_priv: Per-thread list of retired objects pushed in bulk to domain */
class hazptr_priv;

/** hazptr_domain: Class of hazard pointer domains. Each domain manages a set
 *  of hazard pointers and a set of retired objects. */
class hazptr_domain {
  memory_resource* mr_;
  std::atomic<hazptr_rec*> hazptrs_ = {nullptr};
  std::atomic<hazptr_obj*> retired_ = {nullptr};
  /* Using signed int for rcount_ because it may transiently be
   * negative.  Using signed int for all integer variables that may be
   * involved in calculations related to the value of rcount_. */
  std::atomic<int> hcount_ = {0};
  std::atomic<int> rcount_ = {0};

  static constexpr uint64_t syncTimePeriod_{2000000000}; // in ns
  std::atomic<uint64_t> syncTime_{0};

 public:
  constexpr explicit hazptr_domain(
      memory_resource* = get_default_resource()) noexcept;
  ~hazptr_domain();

  hazptr_domain(const hazptr_domain&) = delete;
  hazptr_domain(hazptr_domain&&) = delete;
  hazptr_domain& operator=(const hazptr_domain&) = delete;
  hazptr_domain& operator=(hazptr_domain&&) = delete;

  /** Free-function retire.  May allocate memory */
  template <typename T, typename D = std::default_delete<T>>
  void retire(T* obj, D reclaim = {});
  void cleanup();
  void tryTimedCleanup();

 private:
  friend class hazptr_holder;
  template <typename, typename>
  friend class hazptr_obj_base;
  template <typename, typename>
  friend class hazptr_obj_base_refcounted;
  friend class hazptr_priv;

  void objRetire(hazptr_obj*);
  hazptr_rec* hazptrAcquire();
  void hazptrRelease(hazptr_rec*) noexcept;
  int pushRetired(hazptr_obj* head, hazptr_obj* tail, int count);
  bool reachedThreshold(int rcount);
  void tryBulkReclaim();
  void bulkReclaim();
};

/** Get the default hazptr_domain */
hazptr_domain& default_hazptr_domain();

extern hazptr_domain default_domain_;

/** Free-function retire, that operates on the default domain */
template <typename T, typename D = std::default_delete<T>>
void hazptr_retire(T* obj, D reclaim = {});

/** hazptr_cleanup
 *  Reclaims all reclaimable objects retired to the domain before this call.
 */
void hazptr_cleanup(hazptr_domain& domain = default_hazptr_domain());

/** Definition of hazptr_obj */
class hazptr_obj {
  friend class hazptr_domain;
  template <typename, typename>
  friend class hazptr_obj_base;
  template <typename, typename>
  friend class hazptr_obj_base_refcounted;
  friend class hazptr_priv;

  void (*reclaim_)(hazptr_obj*);
  hazptr_obj* next_;

 public:
  // All constructors set next_ to this in order to catch misuse bugs like
  // double retire.
  hazptr_obj() noexcept : next_(this) {}

  hazptr_obj(const hazptr_obj&) noexcept : next_(this) {}

  hazptr_obj(hazptr_obj&&) noexcept : next_(this) {}

  hazptr_obj& operator=(const hazptr_obj&) {
    return *this;
  }

  hazptr_obj& operator=(hazptr_obj&&) {
    return *this;
  }

 private:
  void set_next(hazptr_obj* obj) {
    next_ = obj;
  }

  void retireCheck() {
    // Only for catching misuse bugs like double retire
    if (next_ != this) {
      retireCheckFail();
    }
  }

  FOLLY_NOINLINE void retireCheckFail() {
    CHECK_EQ(next_, this);
  }

  const void* getObjPtr() const;
};

/** Definition of hazptr_obj_base */
template <typename T, typename D = std::default_delete<T>>
class hazptr_obj_base : public hazptr_obj {
 public:
  /* Retire a removed object and pass the responsibility for
   * reclaiming it to the hazptr library */
  void retire(hazptr_domain& domain = default_hazptr_domain(), D reclaim = {});

 private:
  D deleter_;
};

/** Definition of hazptr_recounted_obj_base */
template <typename T, typename D = std::default_delete<T>>
class hazptr_obj_base_refcounted : public hazptr_obj {
 public:
  /* Retire a removed object and pass the responsibility for
   * reclaiming it to the hazptr library */
  void retire(hazptr_domain& domain = default_hazptr_domain(), D reclaim = {});

  /* aquire_ref() increments the reference count
   *
   * acquire_ref_safe() is the same as acquire_ref() except that in
   * addition the caller guarantees that the call is made in a
   * thread-safe context, e.g., the object is not yet shared. This is
   * just an optimization to save an atomic operation.
   *
   * release_ref() decrements the reference count and returns true if
   * the object is safe to reclaim.
   */
  void acquire_ref();
  void acquire_ref_safe();
  bool release_ref();

 private:
  void preRetire(D deleter);

  std::atomic<uint32_t> refcount_{0};
  D deleter_;
};

/** hazptr_holder: Class for automatic acquisition and release of
 *  hazard pointers, and interface for hazard pointer operations. */
class hazptr_holder {
  template <size_t M>
  friend class hazptr_array;
  template <size_t M>
  friend class hazptr_local;

 public:
  /* Constructor automatically acquires a hazard pointer. */
  explicit hazptr_holder(hazptr_domain& domain = default_hazptr_domain());
  /* Construct an empty hazptr_holder. */
  // Note: This diverges from the proposal in P0233R4
  explicit hazptr_holder(std::nullptr_t) noexcept;

  /* Destructor automatically clears and releases the owned hazard pointer. */
  ~hazptr_holder();

  hazptr_holder(const hazptr_holder&) = delete;
  hazptr_holder& operator=(const hazptr_holder&) = delete;
  // Note: This diverges from the proposal in P0233R4 which disallows
  // move constructor and assignment operator.
  hazptr_holder(hazptr_holder&&) noexcept;
  hazptr_holder& operator=(hazptr_holder&&) noexcept;

  /** Hazard pointer operations */
  /* Returns a protected pointer from the source */
  template <typename T>
  T* get_protected(const std::atomic<T*>& src) noexcept;
  /* Returns a protected pointer from the source, filtering
     the protected pointer through function Func.  Useful for
     stealing bits of the pointer word */
  template <typename T, typename Func>
  T* get_protected(const std::atomic<T*>& src, Func f) noexcept;
  /* Return true if successful in protecting ptr if src == ptr after
   * setting the hazard pointer.  Otherwise sets ptr to src. */
  template <typename T>
  bool try_protect(T*& ptr, const std::atomic<T*>& src) noexcept;
  /* Return true if successful in protecting ptr if src == ptr after
   * setting the hazard pointer, filtering the pointer through Func.
   * Otherwise sets ptr to src. */
  template <typename T, typename Func>
  bool try_protect(T*& ptr, const std::atomic<T*>& src, Func f) noexcept;
  /* Set the hazard pointer to ptr */
  template <typename T>
  void reset(const T* ptr) noexcept;
  /* Set the hazard pointer to nullptr */
  void reset(std::nullptr_t = nullptr) noexcept;

  /* Swap ownership of hazard pointers between hazptr_holder-s. */
  /* Note: The owned hazard pointers remain unmodified during the swap
   * and continue to protect the respective objects that they were
   * protecting before the swap, if any. */
  void swap(hazptr_holder&) noexcept;

 private:
  hazptr_domain* domain_;
  hazptr_rec* hazptr_;
};

void swap(hazptr_holder&, hazptr_holder&) noexcept;

using aligned_hazptr_holder = typename std::
    aligned_storage<sizeof(hazptr_holder), alignof(hazptr_holder)>::type;

/**
 *  hazptr_array: Optimized for bulk construction and destruction of
 *  hazptr_holder-s.
 *
 *  WARNING: Do not move from or to individual hazptr_holder-s.
 *  Only move the whole hazptr_array.
 */
template <size_t M = 1>
class hazptr_array {
  static_assert(M > 0, "M must be a positive integer.");

 public:
  hazptr_array();
  explicit hazptr_array(std::nullptr_t) noexcept;

  hazptr_array(const hazptr_array&) = delete;
  hazptr_array& operator=(const hazptr_array&) = delete;
  hazptr_array(hazptr_array&& other) noexcept;
  hazptr_array& operator=(hazptr_array&& other) noexcept;

  ~hazptr_array();

  hazptr_holder& operator[](size_t i) noexcept;

 private:
  aligned_hazptr_holder raw_[M];
  bool empty_{false};
};

/**
 *  hazptr_local: Optimized for construction and destruction of
 *  one or more hazptr_holder-s with local scope.
 *
 *  WARNING 1: Do not move from or to individual hazptr_holder-s.
 *
 *  WARNING 2: There can only be one hazptr_local active for the same
 *  thread at any time. This is not tracked and checked by the
 *  implementation because it would negate the performance gains of
 *  this class.
 */
template <size_t M = 1>
class hazptr_local {
  static_assert(M > 0, "M must be a positive integer.");

 public:
  hazptr_local();
  hazptr_local(const hazptr_local&) = delete;
  hazptr_local& operator=(const hazptr_local&) = delete;
  hazptr_local(hazptr_local&&) = delete;
  hazptr_local& operator=(hazptr_local&&) = delete;

  ~hazptr_local();

  hazptr_holder& operator[](size_t i) noexcept;

 private:
  aligned_hazptr_holder raw_[M];
  bool slow_path_{false};
};

} // namespace hazptr
} // namespace folly

#include <folly/experimental/hazptr/hazptr-impl.h>
