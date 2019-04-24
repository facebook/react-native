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
#include <folly/detail/ThreadLocalDetail.h>
#include <folly/synchronization/CallOnce.h>

#include <list>
#include <mutex>

constexpr auto kSmallGrowthFactor = 1.1;
constexpr auto kBigGrowthFactor = 1.7;

namespace folly {
namespace threadlocal_detail {

void ThreadEntryNode::initIfZero(bool locked) {
  if (UNLIKELY(!next)) {
    if (LIKELY(locked)) {
      parent->meta->pushBackLocked(parent, id);
    } else {
      parent->meta->pushBackUnlocked(parent, id);
    }
  }
}

void ThreadEntryNode::push_back(ThreadEntry* head) {
  // get the head prev and next nodes
  ThreadEntryNode* hnode = &head->elements[id].node;

  // update current
  next = head;
  prev = hnode->prev;

  // hprev
  ThreadEntryNode* hprev = &hnode->prev->elements[id].node;
  hprev->next = parent;
  hnode->prev = parent;
}

void ThreadEntryNode::eraseZero() {
  if (LIKELY(prev != nullptr)) {
    // get the prev and next nodes
    ThreadEntryNode* nprev = &prev->elements[id].node;
    ThreadEntryNode* nnext = &next->elements[id].node;

    // update the prev and next
    nnext->prev = prev;
    nprev->next = next;

    // set the prev and next to nullptr
    next = prev = nullptr;
  }
}

StaticMetaBase::StaticMetaBase(ThreadEntry* (*threadEntry)(), bool strict)
    : nextId_(1), threadEntry_(threadEntry), strict_(strict) {
  head_.next = head_.prev = &head_;
  int ret = pthread_key_create(&pthreadKey_, &onThreadExit);
  checkPosixError(ret, "pthread_key_create failed");
  PthreadKeyUnregister::registerKey(pthreadKey_);
}

ThreadEntryList* StaticMetaBase::getThreadEntryList() {
#ifdef FOLLY_TLD_USE_FOLLY_TLS
  static FOLLY_TLS ThreadEntryList threadEntryListSingleton;
  return &threadEntryListSingleton;
#else
  class PthreadKey {
   public:
    PthreadKey() {
      int ret = pthread_key_create(&pthreadKey_, nullptr);
      checkPosixError(ret, "pthread_key_create failed");
      PthreadKeyUnregister::registerKey(pthreadKey_);
    }

    FOLLY_ALWAYS_INLINE pthread_key_t get() const {
      return pthreadKey_;
    }

   private:
    pthread_key_t pthreadKey_;
  };

  static auto instance = detail::createGlobal<PthreadKey, void>();

  ThreadEntryList* threadEntryList =
      static_cast<ThreadEntryList*>(pthread_getspecific(instance->get()));

  if (UNLIKELY(!threadEntryList)) {
    threadEntryList = new ThreadEntryList();
    int ret = pthread_setspecific(instance->get(), threadEntryList);
    checkPosixError(ret, "pthread_setspecific failed");
  }

  return threadEntryList;
#endif
}

void StaticMetaBase::onThreadExit(void* ptr) {
  auto threadEntry = static_cast<ThreadEntry*>(ptr);

  {
    auto& meta = *threadEntry->meta;

    // Make sure this ThreadEntry is available if ThreadLocal A is accessed in
    // ThreadLocal B destructor.
    pthread_setspecific(meta.pthreadKey_, threadEntry);
    SharedMutex::ReadHolder rlock(nullptr);
    if (meta.strict_) {
      rlock = SharedMutex::ReadHolder(meta.accessAllThreadsLock_);
    }
    {
      std::lock_guard<std::mutex> g(meta.lock_);
      // mark it as removed
      threadEntry->removed_ = true;
      meta.erase(&(*threadEntry));
      auto elementsCapacity = threadEntry->getElementsCapacity();
      for (size_t i = 0u; i < elementsCapacity; ++i) {
        threadEntry->elements[i].node.eraseZero();
      }
      // No need to hold the lock any longer; the ThreadEntry is private to this
      // thread now that it's been removed from meta.
    }
    // NOTE: User-provided deleter / object dtor itself may be using ThreadLocal
    // with the same Tag, so dispose() calls below may (re)create some of the
    // elements or even increase elementsCapacity, thus multiple cleanup rounds
    // may be required.
    for (bool shouldRun = true; shouldRun;) {
      shouldRun = false;
      auto elementsCapacity = threadEntry->getElementsCapacity();
      FOR_EACH_RANGE (i, 0, elementsCapacity) {
        if (threadEntry->elements[i].dispose(TLPDestructionMode::THIS_THREAD)) {
          threadEntry->elements[i].cleanup();
          shouldRun = true;
        }
      }
    }
    pthread_setspecific(meta.pthreadKey_, nullptr);
  }

  auto threadEntryList = threadEntry->list;
  DCHECK_GT(threadEntryList->count, 0u);

  --threadEntryList->count;

  if (threadEntryList->count) {
    return;
  }

  // dispose all the elements
  for (bool shouldRunOuter = true; shouldRunOuter;) {
    shouldRunOuter = false;
    auto tmp = threadEntryList->head;
    while (tmp) {
      auto& meta = *tmp->meta;
      pthread_setspecific(meta.pthreadKey_, tmp);
      SharedMutex::ReadHolder rlock(nullptr);
      if (meta.strict_) {
        rlock = SharedMutex::ReadHolder(meta.accessAllThreadsLock_);
      }
      for (bool shouldRunInner = true; shouldRunInner;) {
        shouldRunInner = false;
        auto elementsCapacity = tmp->getElementsCapacity();
        FOR_EACH_RANGE (i, 0, elementsCapacity) {
          if (tmp->elements[i].dispose(TLPDestructionMode::THIS_THREAD)) {
            tmp->elements[i].cleanup();
            shouldRunInner = true;
            shouldRunOuter = true;
          }
        }
      }
      pthread_setspecific(meta.pthreadKey_, nullptr);
      tmp = tmp->listNext;
    }
  }

  // free the entry list
  auto head = threadEntryList->head;
  threadEntryList->head = nullptr;
  while (head) {
    auto tmp = head;
    head = head->listNext;
    if (tmp->elements) {
      free(tmp->elements);
      tmp->elements = nullptr;
      tmp->setElementsCapacity(0);
    }

#ifndef FOLLY_TLD_USE_FOLLY_TLS
    delete tmp;
#endif
  }

#ifndef FOLLY_TLD_USE_FOLLY_TLS
  delete threadEntryList;
#endif
}

uint32_t StaticMetaBase::elementsCapacity() const {
  ThreadEntry* threadEntry = (*threadEntry_)();

  return FOLLY_LIKELY(!!threadEntry) ? threadEntry->getElementsCapacity() : 0;
}

uint32_t StaticMetaBase::allocate(EntryID* ent) {
  uint32_t id;
  auto& meta = *this;
  std::lock_guard<std::mutex> g(meta.lock_);

  id = ent->value.load();
  if (id != kEntryIDInvalid) {
    return id;
  }

  if (!meta.freeIds_.empty()) {
    id = meta.freeIds_.back();
    meta.freeIds_.pop_back();
  } else {
    id = meta.nextId_++;
  }

  uint32_t old_id = ent->value.exchange(id);
  DCHECK_EQ(old_id, kEntryIDInvalid);

  reserveHeadUnlocked(id);

  return id;
}

void StaticMetaBase::destroy(EntryID* ent) {
  try {
    auto& meta = *this;

    // Elements in other threads that use this id.
    std::vector<ElementWrapper> elements;

    {
      SharedMutex::WriteHolder wlock(nullptr);
      if (meta.strict_) {
        /*
         * In strict mode, the logic guarantees per-thread instances are
         * destroyed by the moment ThreadLocal<> dtor returns.
         * In order to achieve that, we should wait until concurrent
         * onThreadExit() calls (that might acquire ownership over per-thread
         * instances in order to destroy them) are finished.
         */
        wlock = SharedMutex::WriteHolder(meta.accessAllThreadsLock_);
      }

      {
        std::lock_guard<std::mutex> g(meta.lock_);
        uint32_t id = ent->value.exchange(kEntryIDInvalid);
        if (id == kEntryIDInvalid) {
          return;
        }

        auto& node = meta.head_.elements[id].node;
        while (!node.empty()) {
          auto* next = node.getNext();
          next->eraseZero();

          ThreadEntry* e = next->parent;
          auto elementsCapacity = e->getElementsCapacity();
          if (id < elementsCapacity && e->elements[id].ptr) {
            elements.push_back(e->elements[id]);

            /*
             * Writing another thread's ThreadEntry from here is fine;
             * the only other potential reader is the owning thread --
             * from onThreadExit (which grabs the lock, so is properly
             * synchronized with us) or from get(), which also grabs
             * the lock if it needs to resize the elements vector.
             *
             * We can't conflict with reads for a get(id), because
             * it's illegal to call get on a thread local that's
             * destructing.
             */
            e->elements[id].ptr = nullptr;
            e->elements[id].deleter1 = nullptr;
            e->elements[id].ownsDeleter = false;
          }
        }
        meta.freeIds_.push_back(id);
      }
    }
    // Delete elements outside the locks.
    for (ElementWrapper& elem : elements) {
      if (elem.dispose(TLPDestructionMode::ALL_THREADS)) {
        elem.cleanup();
      }
    }
  } catch (...) { // Just in case we get a lock error or something anyway...
    LOG(WARNING) << "Destructor discarding an exception that was thrown.";
  }
}

ElementWrapper* StaticMetaBase::reallocate(
    ThreadEntry* threadEntry,
    uint32_t idval,
    size_t& newCapacity) {
  size_t prevCapacity = threadEntry->getElementsCapacity();

  // Growth factor < 2, see folly/docs/FBVector.md; + 5 to prevent
  // very slow start.
  auto smallCapacity = static_cast<size_t>((idval + 5) * kSmallGrowthFactor);
  auto bigCapacity = static_cast<size_t>((idval + 5) * kBigGrowthFactor);

  newCapacity =
      (threadEntry->meta &&
       (bigCapacity <= threadEntry->meta->head_.getElementsCapacity()))
      ? bigCapacity
      : smallCapacity;

  assert(newCapacity > prevCapacity);
  ElementWrapper* reallocated = nullptr;

  // Need to grow. Note that we can't call realloc, as elements is
  // still linked in meta, so another thread might access invalid memory
  // after realloc succeeds. We'll copy by hand and update our ThreadEntry
  // under the lock.
  if (usingJEMalloc()) {
    bool success = false;
    size_t newByteSize = nallocx(newCapacity * sizeof(ElementWrapper), 0);

    // Try to grow in place.
    //
    // Note that xallocx(MALLOCX_ZERO) will only zero newly allocated memory,
    // even if a previous allocation allocated more than we requested.
    // This is fine; we always use MALLOCX_ZERO with jemalloc and we
    // always expand our allocation to the real size.
    if (prevCapacity * sizeof(ElementWrapper) >= jemallocMinInPlaceExpandable) {
      success =
          (xallocx(threadEntry->elements, newByteSize, 0, MALLOCX_ZERO) ==
           newByteSize);
    }

    // In-place growth failed.
    if (!success) {
      success =
          ((reallocated = static_cast<ElementWrapper*>(
                mallocx(newByteSize, MALLOCX_ZERO))) != nullptr);
    }

    if (success) {
      // Expand to real size
      assert(newByteSize / sizeof(ElementWrapper) >= newCapacity);
      newCapacity = newByteSize / sizeof(ElementWrapper);
    } else {
      throw std::bad_alloc();
    }
  } else { // no jemalloc
    // calloc() is simpler than malloc() followed by memset(), and
    // potentially faster when dealing with a lot of memory, as it can get
    // already-zeroed pages from the kernel.
    reallocated = static_cast<ElementWrapper*>(
        calloc(newCapacity, sizeof(ElementWrapper)));
    if (!reallocated) {
      throw std::bad_alloc();
    }
  }

  return reallocated;
}

/**
 * Reserve enough space in the ThreadEntry::elements for the item
 * @id to fit in.
 */

void StaticMetaBase::reserve(EntryID* id) {
  auto& meta = *this;
  ThreadEntry* threadEntry = (*threadEntry_)();
  size_t prevCapacity = threadEntry->getElementsCapacity();

  uint32_t idval = id->getOrAllocate(meta);
  if (prevCapacity > idval) {
    return;
  }

  size_t newCapacity;
  ElementWrapper* reallocated = reallocate(threadEntry, idval, newCapacity);

  // Success, update the entry
  {
    std::lock_guard<std::mutex> g(meta.lock_);

    if (prevCapacity == 0) {
      meta.push_back(threadEntry);
    }

    if (reallocated) {
      /*
       * Note: we need to hold the meta lock when copying data out of
       * the old vector, because some other thread might be
       * destructing a ThreadLocal and writing to the elements vector
       * of this thread.
       */
      if (prevCapacity != 0) {
        memcpy(
            reallocated,
            threadEntry->elements,
            sizeof(*reallocated) * prevCapacity);
      }
      std::swap(reallocated, threadEntry->elements);
    }

    for (size_t i = prevCapacity; i < newCapacity; i++) {
      threadEntry->elements[i].node.initZero(threadEntry, i);
    }

    threadEntry->setElementsCapacity(newCapacity);
  }

  free(reallocated);
}

void StaticMetaBase::reserveHeadUnlocked(uint32_t id) {
  if (head_.getElementsCapacity() <= id) {
    size_t prevCapacity = head_.getElementsCapacity();
    size_t newCapacity;
    ElementWrapper* reallocated = reallocate(&head_, id, newCapacity);

    if (reallocated) {
      if (prevCapacity != 0) {
        memcpy(
            reallocated, head_.elements, sizeof(*reallocated) * prevCapacity);
      }
      std::swap(reallocated, head_.elements);
    }

    for (size_t i = prevCapacity; i < newCapacity; i++) {
      head_.elements[i].node.init(&head_, i);
    }

    head_.setElementsCapacity(newCapacity);
    free(reallocated);
  }
}

void StaticMetaBase::pushBackLocked(ThreadEntry* t, uint32_t id) {
  if (LIKELY(!t->removed_)) {
    std::lock_guard<std::mutex> g(lock_);
    auto* node = &t->elements[id].node;
    node->push_back(&head_);
  }
}

void StaticMetaBase::pushBackUnlocked(ThreadEntry* t, uint32_t id) {
  if (LIKELY(!t->removed_)) {
    auto* node = &t->elements[id].node;
    node->push_back(&head_);
  }
}

FOLLY_STATIC_CTOR_PRIORITY_MAX
PthreadKeyUnregister PthreadKeyUnregister::instance_;
} // namespace threadlocal_detail
} // namespace folly
