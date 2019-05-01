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

#pragma once

#include <limits.h>

#include <atomic>
#include <functional>
#include <mutex>
#include <string>
#include <vector>

#include <glog/logging.h>

#include <folly/Exception.h>
#include <folly/Function.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#include <folly/SharedMutex.h>
#include <folly/container/Foreach.h>
#include <folly/detail/AtFork.h>
#include <folly/memory/Malloc.h>
#include <folly/portability/PThread.h>
#include <folly/synchronization/MicroSpinLock.h>

#include <folly/detail/StaticSingletonManager.h>

// In general, emutls cleanup is not guaranteed to play nice with the way
// StaticMeta mixes direct pthread calls and the use of __thread. This has
// caused problems on multiple platforms so don't use __thread there.
//
// XXX: Ideally we would instead determine if emutls is in use at runtime as it
// is possible to configure glibc on Linux to use emutls regardless.
#if !FOLLY_MOBILE && !defined(__APPLE__) && !defined(_MSC_VER)
#define FOLLY_TLD_USE_FOLLY_TLS 1
#else
#undef FOLLY_TLD_USE_FOLLY_TLS
#endif

namespace folly {

enum class TLPDestructionMode { THIS_THREAD, ALL_THREADS };
struct AccessModeStrict {};

namespace threadlocal_detail {

constexpr uint32_t kEntryIDInvalid = std::numeric_limits<uint32_t>::max();

struct ThreadEntry;
/* This represents a node in doubly linked list where all the nodes
 * are part of an ElementWrapper struct that has the same id.
 * we cannot use prev and next as ThreadEntryNode pointers since the
 * ThreadEntry::elements can be reallocated and the pointers will change
 * in this case. So we keep a pointer to the parent ThreadEntry struct
 * one for the prev and next and also the id.
 * We will traverse and update the list only when holding the
 * StaticMetaBase::lock_
 */
struct ThreadEntryNode {
  uint32_t id;
  ThreadEntry* parent;
  ThreadEntry* prev;
  ThreadEntry* next;

  void initIfZero(bool locked);

  void init(ThreadEntry* entry, uint32_t newId) {
    id = newId;
    parent = prev = next = entry;
  }

  void initZero(ThreadEntry* entry, uint32_t newId) {
    id = newId;
    parent = entry;
    prev = next = nullptr;
  }

  // if the list this node is part of is empty
  FOLLY_ALWAYS_INLINE bool empty() const {
    return (next == parent);
  }

  FOLLY_ALWAYS_INLINE bool zero() const {
    return (!prev);
  }

  FOLLY_ALWAYS_INLINE ThreadEntry* getThreadEntry() {
    return parent;
  }

  FOLLY_ALWAYS_INLINE ThreadEntryNode* getPrev();

  FOLLY_ALWAYS_INLINE ThreadEntryNode* getNext();

  void push_back(ThreadEntry* head);

  void eraseZero();
};

/**
 * POD wrapper around an element (a void*) and an associated deleter.
 * This must be POD, as we memset() it to 0 and memcpy() it around.
 */
struct ElementWrapper {
  using DeleterFunType = void(void*, TLPDestructionMode);

  bool dispose(TLPDestructionMode mode) {
    if (ptr == nullptr) {
      return false;
    }

    DCHECK(deleter1 != nullptr);
    ownsDeleter ? (*deleter2)(ptr, mode) : (*deleter1)(ptr, mode);
    return true;
  }

  void* release() {
    auto retPtr = ptr;

    if (ptr != nullptr) {
      cleanup();
    }

    return retPtr;
  }

  template <class Ptr>
  void set(Ptr p) {
    auto guard = makeGuard([&] { delete p; });
    DCHECK(ptr == nullptr);
    DCHECK(deleter1 == nullptr);

    if (p) {
      node.initIfZero(true /*locked*/);
      ptr = p;
      deleter1 = [](void* pt, TLPDestructionMode) {
        delete static_cast<Ptr>(pt);
      };
      ownsDeleter = false;
      guard.dismiss();
    }
  }

  template <class Ptr, class Deleter>
  void set(Ptr p, const Deleter& d) {
    auto guard = makeGuard([&] {
      if (p) {
        d(p, TLPDestructionMode::THIS_THREAD);
      }
    });
    DCHECK(ptr == nullptr);
    DCHECK(deleter2 == nullptr);
    if (p) {
      node.initIfZero(true /*locked*/);
      ptr = p;
      auto d2 = d; // gcc-4.8 doesn't decay types correctly in lambda captures
      deleter2 = new std::function<DeleterFunType>(
          [d2](void* pt, TLPDestructionMode mode) {
            d2(static_cast<Ptr>(pt), mode);
          });
      ownsDeleter = true;
      guard.dismiss();
    }
  }

  void cleanup() {
    if (ownsDeleter) {
      delete deleter2;
    }
    ptr = nullptr;
    deleter1 = nullptr;
    ownsDeleter = false;
  }

  void* ptr;
  union {
    DeleterFunType* deleter1;
    std::function<DeleterFunType>* deleter2;
  };
  bool ownsDeleter;
  ThreadEntryNode node;
};

struct StaticMetaBase;
struct ThreadEntryList;

/**
 * Per-thread entry.  Each thread using a StaticMeta object has one.
 * This is written from the owning thread only (under the lock), read
 * from the owning thread (no lock necessary), and read from other threads
 * (under the lock).
 * StaticMetaBase::head_ elementsCapacity can be read from any thread on
 * reallocate (no lock)
 */
struct ThreadEntry {
  ElementWrapper* elements{nullptr};
  std::atomic<size_t> elementsCapacity{0};
  ThreadEntry* next{nullptr};
  ThreadEntry* prev{nullptr};
  ThreadEntryList* list{nullptr};
  ThreadEntry* listNext{nullptr};
  StaticMetaBase* meta{nullptr};
  bool removed_{false};

  size_t getElementsCapacity() const noexcept {
    return elementsCapacity.load(std::memory_order_relaxed);
  }

  void setElementsCapacity(size_t capacity) noexcept {
    elementsCapacity.store(capacity, std::memory_order_relaxed);
  }
};

struct ThreadEntryList {
  ThreadEntry* head{nullptr};
  size_t count{0};
};

struct PthreadKeyUnregisterTester;

FOLLY_ALWAYS_INLINE ThreadEntryNode* ThreadEntryNode::getPrev() {
  return &prev->elements[id].node;
}

FOLLY_ALWAYS_INLINE ThreadEntryNode* ThreadEntryNode::getNext() {
  return &next->elements[id].node;
}

/**
 * We want to disable onThreadExit call at the end of shutdown, we don't care
 * about leaking memory at that point.
 *
 * Otherwise if ThreadLocal is used in a shared library, onThreadExit may be
 * called after dlclose().
 *
 * This class has one single static instance; however since it's so widely used,
 * directly or indirectly, by so many classes, we need to take care to avoid
 * problems stemming from the Static Initialization/Destruction Order Fiascos.
 * Therefore this class needs to be constexpr-constructible, so as to avoid
 * the need for this to participate in init/destruction order.
 */
class PthreadKeyUnregister {
 public:
  static constexpr size_t kMaxKeys = 1UL << 16;

  ~PthreadKeyUnregister() {
    // If static constructor priorities are not supported then
    // ~PthreadKeyUnregister logic is not safe.
#if !defined(__APPLE__) && !defined(_MSC_VER)
    MSLGuard lg(lock_);
    while (size_) {
      pthread_key_delete(keys_[--size_]);
    }
#endif
  }

  static void registerKey(pthread_key_t key) {
    instance_.registerKeyImpl(key);
  }

 private:
  /**
   * Only one global instance should exist, hence this is private.
   * See also the important note at the top of this class about `constexpr`
   * usage.
   */
  constexpr PthreadKeyUnregister() : lock_(), size_(0), keys_() {}
  friend struct folly::threadlocal_detail::PthreadKeyUnregisterTester;

  void registerKeyImpl(pthread_key_t key) {
    MSLGuard lg(lock_);
    if (size_ == kMaxKeys) {
      throw std::logic_error("pthread_key limit has already been reached");
    }
    keys_[size_++] = key;
  }

  MicroSpinLock lock_;
  size_t size_;
  pthread_key_t keys_[kMaxKeys];

  static PthreadKeyUnregister instance_;
};

struct StaticMetaBase {
  // Represents an ID of a thread local object. Initially set to the maximum
  // uint. This representation allows us to avoid a branch in accessing TLS data
  // (because if you test capacity > id if id = maxint then the test will always
  // fail). It allows us to keep a constexpr constructor and avoid SIOF.
  class EntryID {
   public:
    std::atomic<uint32_t> value;

    constexpr EntryID() : value(kEntryIDInvalid) {}

    EntryID(EntryID&& other) noexcept : value(other.value.load()) {
      other.value = kEntryIDInvalid;
    }

    EntryID& operator=(EntryID&& other) {
      assert(this != &other);
      value = other.value.load();
      other.value = kEntryIDInvalid;
      return *this;
    }

    EntryID(const EntryID& other) = delete;
    EntryID& operator=(const EntryID& other) = delete;

    uint32_t getOrInvalid() {
      // It's OK for this to be relaxed, even though we're effectively doing
      // double checked locking in using this value. We only care about the
      // uniqueness of IDs, getOrAllocate does not modify any other memory
      // this thread will use.
      return value.load(std::memory_order_relaxed);
    }

    uint32_t getOrAllocate(StaticMetaBase& meta) {
      uint32_t id = getOrInvalid();
      if (id != kEntryIDInvalid) {
        return id;
      }
      // The lock inside allocate ensures that a single value is allocated
      return meta.allocate(this);
    }
  };

  StaticMetaBase(ThreadEntry* (*threadEntry)(), bool strict);

  void push_back(ThreadEntry* t) {
    t->next = &head_;
    t->prev = head_.prev;
    head_.prev->next = t;
    head_.prev = t;
  }

  void erase(ThreadEntry* t) {
    t->next->prev = t->prev;
    t->prev->next = t->next;
    t->next = t->prev = t;
  }

  FOLLY_EXPORT static ThreadEntryList* getThreadEntryList();

  static void onThreadExit(void* ptr);

  // returns the elementsCapacity for the
  // current thread ThreadEntry struct
  uint32_t elementsCapacity() const;

  uint32_t allocate(EntryID* ent);

  void destroy(EntryID* ent);

  /**
   * Reserve enough space in the ThreadEntry::elements for the item
   * @id to fit in.
   */
  void reserve(EntryID* id);

  ElementWrapper& getElement(EntryID* ent);

  // reserve an id in the head_ ThreadEntry->elements
  // array if not already there
  void reserveHeadUnlocked(uint32_t id);

  // push back an entry in the doubly linked list
  // that corresponds to idx id
  void pushBackLocked(ThreadEntry* t, uint32_t id);
  void pushBackUnlocked(ThreadEntry* t, uint32_t id);

  // static helper method to reallocate the ThreadEntry::elements
  // returns != nullptr if the ThreadEntry::elements was reallocated
  // nullptr if the ThreadEntry::elements was just extended
  // and throws stdd:bad_alloc if memory cannot be allocated
  static ElementWrapper*
  reallocate(ThreadEntry* threadEntry, uint32_t idval, size_t& newCapacity);

  uint32_t nextId_;
  std::vector<uint32_t> freeIds_;
  std::mutex lock_;
  SharedMutex accessAllThreadsLock_;
  pthread_key_t pthreadKey_;
  ThreadEntry head_;
  ThreadEntry* (*threadEntry_)();
  bool strict_;

 protected:
  ~StaticMetaBase() {}
};

// Held in a singleton to track our global instances.
// We have one of these per "Tag", by default one for the whole system
// (Tag=void).
//
// Creating and destroying ThreadLocalPtr objects, as well as thread exit
// for threads that use ThreadLocalPtr objects collide on a lock inside
// StaticMeta; you can specify multiple Tag types to break that lock.
template <class Tag, class AccessMode>
struct StaticMeta final : StaticMetaBase {
  StaticMeta()
      : StaticMetaBase(
            &StaticMeta::getThreadEntrySlow,
            std::is_same<AccessMode, AccessModeStrict>::value) {
    detail::AtFork::registerHandler(
        this,
        /*prepare*/ &StaticMeta::preFork,
        /*parent*/ &StaticMeta::onForkParent,
        /*child*/ &StaticMeta::onForkChild);
  }

  ~StaticMeta() = delete;

  static StaticMeta<Tag, AccessMode>& instance() {
    // Leak it on exit, there's only one per process and we don't have to
    // worry about synchronization with exiting threads.
    /* library-local */ static auto instance =
        detail::createGlobal<StaticMeta<Tag, AccessMode>, void>();
    return *instance;
  }

  FOLLY_EXPORT FOLLY_ALWAYS_INLINE static ElementWrapper& get(EntryID* ent) {
    // Eliminate as many branches and as much extra code as possible in the
    // cached fast path, leaving only one branch here and one indirection below.
    uint32_t id = ent->getOrInvalid();
#ifdef FOLLY_TLD_USE_FOLLY_TLS
    static FOLLY_TLS ThreadEntry* threadEntry{};
    static FOLLY_TLS size_t capacity{};
#else
    ThreadEntry* threadEntry{};
    size_t capacity{};
#endif
    if (FOLLY_UNLIKELY(capacity <= id)) {
      getSlowReserveAndCache(ent, id, threadEntry, capacity);
    }
    return threadEntry->elements[id];
  }

  FOLLY_NOINLINE static void getSlowReserveAndCache(
      EntryID* ent,
      uint32_t& id,
      ThreadEntry*& threadEntry,
      size_t& capacity) {
    auto& inst = instance();
    threadEntry = inst.threadEntry_();
    if (UNLIKELY(threadEntry->getElementsCapacity() <= id)) {
      inst.reserve(ent);
      id = ent->getOrInvalid();
    }
    capacity = threadEntry->getElementsCapacity();
    assert(capacity > id);
  }

  FOLLY_EXPORT FOLLY_NOINLINE static ThreadEntry* getThreadEntrySlow() {
    auto& meta = instance();
    auto key = meta.pthreadKey_;
    ThreadEntry* threadEntry =
        static_cast<ThreadEntry*>(pthread_getspecific(key));
    if (!threadEntry) {
      ThreadEntryList* threadEntryList = StaticMeta::getThreadEntryList();
#ifdef FOLLY_TLD_USE_FOLLY_TLS
      static FOLLY_TLS ThreadEntry threadEntrySingleton;
      threadEntry = &threadEntrySingleton;
#else
      threadEntry = new ThreadEntry();
#endif
      // if the ThreadEntry already exists
      // but pthread_getspecific returns NULL
      // do not add the same entry twice to the list
      // since this would create a loop in the list
      if (!threadEntry->list) {
        threadEntry->list = threadEntryList;
        threadEntry->listNext = threadEntryList->head;
        threadEntryList->head = threadEntry;
      }

      // if we're adding a thread entry
      // we need to increment the list count
      // even if the entry is reused
      threadEntryList->count++;

      threadEntry->meta = &meta;
      int ret = pthread_setspecific(key, threadEntry);
      checkPosixError(ret, "pthread_setspecific failed");
    }
    return threadEntry;
  }

  static bool preFork() {
    return instance().lock_.try_lock(); // Make sure it's created
  }

  static void onForkParent() {
    instance().lock_.unlock();
  }

  static void onForkChild() {
    // only the current thread survives
    auto& head = instance().head_;
    // init the head list
    head.next = head.prev = &head;
    // init the circular lists
    auto elementsCapacity = head.getElementsCapacity();
    for (size_t i = 0u; i < elementsCapacity; ++i) {
      head.elements[i].node.init(&head, static_cast<uint32_t>(i));
    }
    // init the thread entry
    ThreadEntry* threadEntry = instance().threadEntry_();
    elementsCapacity = threadEntry->getElementsCapacity();
    for (size_t i = 0u; i < elementsCapacity; ++i) {
      if (!threadEntry->elements[i].node.zero()) {
        threadEntry->elements[i].node.initZero(
            threadEntry, static_cast<uint32_t>(i));
        threadEntry->elements[i].node.initIfZero(false /*locked*/);
      }
    }

    // If this thread was in the list before the fork, add it back.
    if (elementsCapacity != 0) {
      instance().push_back(threadEntry);
    }
    instance().lock_.unlock();
  }
};
} // namespace threadlocal_detail
} // namespace folly
