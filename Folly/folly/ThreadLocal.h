/*
 * Copyright 2011-present Facebook, Inc.
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

/**
 * Improved thread local storage for non-trivial types (similar speed as
 * pthread_getspecific but only consumes a single pthread_key_t, and 4x faster
 * than boost::thread_specific_ptr).
 *
 * Also includes an accessor interface to walk all the thread local child
 * objects of a parent.  accessAllThreads() initializes an accessor which holds
 * a global lock *that blocks all creation and destruction of ThreadLocal
 * objects with the same Tag* and can be used as an iterable container.
 * accessAllThreads() can race with destruction of thread-local elements. We
 * provide a strict mode which is dangerous because it requires the access lock
 * to be held while destroying thread-local elements which could cause
 * deadlocks. We gate this mode behind the AccessModeStrict template parameter.
 *
 * Intended use is for frequent write, infrequent read data access patterns such
 * as counters.
 *
 * There are two classes here - ThreadLocal and ThreadLocalPtr.  ThreadLocalPtr
 * has semantics similar to boost::thread_specific_ptr. ThreadLocal is a thin
 * wrapper around ThreadLocalPtr that manages allocation automatically.
 *
 * @author Spencer Ahrens (sahrens)
 */

#pragma once

#include <iterator>
#include <type_traits>
#include <utility>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/SharedMutex.h>
#include <folly/detail/ThreadLocalDetail.h>

namespace folly {

template <class T, class Tag, class AccessMode>
class ThreadLocalPtr;

template <class T, class Tag = void, class AccessMode = void>
class ThreadLocal {
 public:
  constexpr ThreadLocal() : constructor_([]() { return new T(); }) {}

  template <
      typename F,
      _t<std::enable_if<is_invocable_r<T*, F>::value, int>> = 0>
  explicit ThreadLocal(F&& constructor)
      : constructor_(std::forward<F>(constructor)) {}

  FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN T* get() const {
    auto const ptr = tlp_.get();
    return FOLLY_LIKELY(!!ptr) ? ptr : makeTlp();
  }

  T* operator->() const {
    return get();
  }

  T& operator*() const {
    return *get();
  }

  void reset(T* newPtr = nullptr) {
    tlp_.reset(newPtr);
  }

  typedef typename ThreadLocalPtr<T, Tag, AccessMode>::Accessor Accessor;
  Accessor accessAllThreads() const {
    return tlp_.accessAllThreads();
  }

  // movable
  ThreadLocal(ThreadLocal&&) = default;
  ThreadLocal& operator=(ThreadLocal&&) = default;

 private:
  // non-copyable
  ThreadLocal(const ThreadLocal&) = delete;
  ThreadLocal& operator=(const ThreadLocal&) = delete;

  FOLLY_NOINLINE T* makeTlp() const {
    auto const ptr = constructor_();
    tlp_.reset(ptr);
    return ptr;
  }

  mutable ThreadLocalPtr<T, Tag, AccessMode> tlp_;
  std::function<T*()> constructor_;
};

/*
 * The idea here is that __thread is faster than pthread_getspecific, so we
 * keep a __thread array of pointers to objects (ThreadEntry::elements) where
 * each array has an index for each unique instance of the ThreadLocalPtr
 * object.  Each ThreadLocalPtr object has a unique id that is an index into
 * these arrays so we can fetch the correct object from thread local storage
 * very efficiently.
 *
 * In order to prevent unbounded growth of the id space and thus huge
 * ThreadEntry::elements, arrays, for example due to continuous creation and
 * destruction of ThreadLocalPtr objects, we keep a set of all active
 * instances.  When an instance is destroyed we remove it from the active
 * set and insert the id into freeIds_ for reuse.  These operations require a
 * global mutex, but only happen at construction and destruction time.
 *
 * We use a single global pthread_key_t per Tag to manage object destruction and
 * memory cleanup upon thread exit because there is a finite number of
 * pthread_key_t's available per machine.
 *
 * NOTE: Apple platforms don't support the same semantics for __thread that
 *       Linux does (and it's only supported at all on i386). For these, use
 *       pthread_setspecific()/pthread_getspecific() for the per-thread
 *       storage.  Windows (MSVC and GCC) does support the same semantics
 *       with __declspec(thread)
 */

template <class T, class Tag = void, class AccessMode = void>
class ThreadLocalPtr {
 private:
  typedef threadlocal_detail::StaticMeta<Tag, AccessMode> StaticMeta;

 public:
  constexpr ThreadLocalPtr() : id_() {}

  ThreadLocalPtr(ThreadLocalPtr&& other) noexcept : id_(std::move(other.id_)) {}

  ThreadLocalPtr& operator=(ThreadLocalPtr&& other) {
    assert(this != &other);
    destroy();
    id_ = std::move(other.id_);
    return *this;
  }

  ~ThreadLocalPtr() {
    destroy();
  }

  T* get() const {
    threadlocal_detail::ElementWrapper& w = StaticMeta::get(&id_);
    return static_cast<T*>(w.ptr);
  }

  T* operator->() const {
    return get();
  }

  T& operator*() const {
    return *get();
  }

  T* release() {
    threadlocal_detail::ElementWrapper& w = StaticMeta::get(&id_);

    return static_cast<T*>(w.release());
  }

  void reset(T* newPtr = nullptr) {
    auto guard = makeGuard([&] { delete newPtr; });
    threadlocal_detail::ElementWrapper* w = &StaticMeta::get(&id_);

    w->dispose(TLPDestructionMode::THIS_THREAD);
    // need to get a new ptr since the
    // ThreadEntry::elements array can be reallocated
    w = &StaticMeta::get(&id_);
    w->cleanup();
    guard.dismiss();
    w->set(newPtr);
  }

  explicit operator bool() const {
    return get() != nullptr;
  }

  /**
   * reset() that transfers ownership from a smart pointer
   */
  template <
      typename SourceT,
      typename Deleter,
      typename = typename std::enable_if<
          std::is_convertible<SourceT*, T*>::value>::type>
  void reset(std::unique_ptr<SourceT, Deleter> source) {
    auto deleter = [delegate = source.get_deleter()](
                       T* ptr, TLPDestructionMode) { delegate(ptr); };
    reset(source.release(), deleter);
  }

  /**
   * reset() that transfers ownership from a smart pointer with the default
   * deleter
   */
  template <
      typename SourceT,
      typename = typename std::enable_if<
          std::is_convertible<SourceT*, T*>::value>::type>
  void reset(std::unique_ptr<SourceT> source) {
    reset(source.release());
  }

  /**
   * reset() with a custom deleter:
   * deleter(T* ptr, TLPDestructionMode mode)
   * "mode" is ALL_THREADS if we're destructing this ThreadLocalPtr (and thus
   * deleting pointers for all threads), and THIS_THREAD if we're only deleting
   * the member for one thread (because of thread exit or reset()).
   * Invoking the deleter must not throw.
   */
  template <class Deleter>
  void reset(T* newPtr, const Deleter& deleter) {
    auto guard = makeGuard([&] {
      if (newPtr) {
        deleter(newPtr, TLPDestructionMode::THIS_THREAD);
      }
    });
    threadlocal_detail::ElementWrapper* w = &StaticMeta::get(&id_);
    w->dispose(TLPDestructionMode::THIS_THREAD);
    // need to get a new ptr since the
    // ThreadEntry::elements array can be reallocated
    w = &StaticMeta::get(&id_);
    w->cleanup();
    guard.dismiss();
    w->set(newPtr, deleter);
  }

  // Holds a global lock for iteration through all thread local child objects.
  // Can be used as an iterable container.
  // Use accessAllThreads() to obtain one.
  class Accessor {
    friend class ThreadLocalPtr<T, Tag, AccessMode>;

    threadlocal_detail::StaticMetaBase& meta_;
    SharedMutex* accessAllThreadsLock_;
    std::mutex* lock_;
    uint32_t id_;

   public:
    class Iterator;
    friend class Iterator;

    // The iterators obtained from Accessor are bidirectional iterators.
    class Iterator {
      friend class Accessor;
      const Accessor* accessor_;
      threadlocal_detail::ThreadEntryNode* e_;

      void increment() {
        e_ = e_->getNext();
        incrementToValid();
      }

      void decrement() {
        e_ = e_->getPrev();
        decrementToValid();
      }

      const T& dereference() const {
        return *static_cast<T*>(
            e_->getThreadEntry()->elements[accessor_->id_].ptr);
      }

      T& dereference() {
        return *static_cast<T*>(
            e_->getThreadEntry()->elements[accessor_->id_].ptr);
      }

      bool equal(const Iterator& other) const {
        return (accessor_->id_ == other.accessor_->id_ && e_ == other.e_);
      }

      explicit Iterator(const Accessor* accessor)
          : accessor_(accessor),
            e_(&accessor_->meta_.head_.elements[accessor_->id_].node) {}

      // we just need to check the ptr since it can be set to nullptr
      // even if the entry is part of the list
      bool valid() const {
        return (e_->getThreadEntry()->elements[accessor_->id_].ptr);
      }

      void incrementToValid() {
        for (; e_ != &accessor_->meta_.head_.elements[accessor_->id_].node &&
             !valid();
             e_ = e_->getNext()) {
        }
      }

      void decrementToValid() {
        for (; e_ != &accessor_->meta_.head_.elements[accessor_->id_].node &&
             !valid();
             e_ = e_->getPrev()) {
        }
      }

     public:
      using difference_type = ssize_t;
      using value_type = T;
      using reference = T const&;
      using pointer = T const*;
      using iterator_category = std::bidirectional_iterator_tag;

      Iterator& operator++() {
        increment();
        return *this;
      }

      Iterator& operator++(int) {
        Iterator copy(*this);
        increment();
        return copy;
      }

      Iterator& operator--() {
        decrement();
        return *this;
      }

      Iterator& operator--(int) {
        Iterator copy(*this);
        decrement();
        return copy;
      }

      T& operator*() {
        return dereference();
      }

      T const& operator*() const {
        return dereference();
      }

      T* operator->() {
        return &dereference();
      }

      T const* operator->() const {
        return &dereference();
      }

      bool operator==(Iterator const& rhs) const {
        return equal(rhs);
      }

      bool operator!=(Iterator const& rhs) const {
        return !equal(rhs);
      }
    };

    ~Accessor() {
      release();
    }

    Iterator begin() const {
      return ++Iterator(this);
    }

    Iterator end() const {
      return Iterator(this);
    }

    Accessor(const Accessor&) = delete;
    Accessor& operator=(const Accessor&) = delete;

    Accessor(Accessor&& other) noexcept
        : meta_(other.meta_),
          accessAllThreadsLock_(other.accessAllThreadsLock_),
          lock_(other.lock_),
          id_(other.id_) {
      other.id_ = 0;
      other.accessAllThreadsLock_ = nullptr;
      other.lock_ = nullptr;
    }

    Accessor& operator=(Accessor&& other) noexcept {
      // Each Tag has its own unique meta, and accessors with different Tags
      // have different types.  So either *this is empty, or this and other
      // have the same tag.  But if they have the same tag, they have the same
      // meta (and lock), so they'd both hold the lock at the same time,
      // which is impossible, which leaves only one possible scenario --
      // *this is empty.  Assert it.
      assert(&meta_ == &other.meta_);
      assert(lock_ == nullptr);
      using std::swap;
      swap(accessAllThreadsLock_, other.accessAllThreadsLock_);
      swap(lock_, other.lock_);
      swap(id_, other.id_);
    }

    Accessor()
        : meta_(threadlocal_detail::StaticMeta<Tag, AccessMode>::instance()),
          accessAllThreadsLock_(nullptr),
          lock_(nullptr),
          id_(0) {}

   private:
    explicit Accessor(uint32_t id)
        : meta_(threadlocal_detail::StaticMeta<Tag, AccessMode>::instance()),
          accessAllThreadsLock_(&meta_.accessAllThreadsLock_),
          lock_(&meta_.lock_) {
      accessAllThreadsLock_->lock();
      lock_->lock();
      id_ = id;
    }

    void release() {
      if (lock_) {
        lock_->unlock();
        DCHECK(accessAllThreadsLock_ != nullptr);
        accessAllThreadsLock_->unlock();
        id_ = 0;
        lock_ = nullptr;
        accessAllThreadsLock_ = nullptr;
      }
    }
  };

  // accessor allows a client to iterate through all thread local child
  // elements of this ThreadLocal instance.  Holds a global lock for each <Tag>
  Accessor accessAllThreads() const {
    static_assert(
        !std::is_same<Tag, void>::value,
        "Must use a unique Tag to use the accessAllThreads feature");
    return Accessor(id_.getOrAllocate(StaticMeta::instance()));
  }

 private:
  void destroy() {
    StaticMeta::instance().destroy(&id_);
  }

  // non-copyable
  ThreadLocalPtr(const ThreadLocalPtr&) = delete;
  ThreadLocalPtr& operator=(const ThreadLocalPtr&) = delete;

  mutable typename StaticMeta::EntryID id_;
};

namespace threadlocal_detail {
template <typename>
struct static_meta_of;

template <typename T, typename Tag, typename AccessMode>
struct static_meta_of<ThreadLocalPtr<T, Tag, AccessMode>> {
  using type = StaticMeta<Tag, AccessMode>;
};

template <typename T, typename Tag, typename AccessMode>
struct static_meta_of<ThreadLocal<T, Tag, AccessMode>> {
  using type = StaticMeta<Tag, AccessMode>;
};

} // namespace threadlocal_detail
} // namespace folly
