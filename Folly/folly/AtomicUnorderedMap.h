/*
 * Copyright 2013-present Facebook, Inc.
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

#include <atomic>
#include <cstdint>
#include <functional>
#include <limits>
#include <stdexcept>
#include <system_error>
#include <type_traits>

#include <boost/type_traits/has_trivial_destructor.hpp>

#include <folly/Conv.h>
#include <folly/Likely.h>
#include <folly/Random.h>
#include <folly/detail/AtomicUnorderedMapUtils.h>
#include <folly/lang/Bits.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

namespace folly {

/// You're probably reading this because you are looking for an
/// AtomicUnorderedMap<K,V> that is fully general, highly concurrent (for
/// reads, writes, and iteration), and makes no performance compromises.
/// We haven't figured that one out yet.  What you will find here is a
/// hash table implementation that sacrifices generality so that it can
/// give you all of the other things.
///
/// LIMITATIONS:
///
/// * Insert only (*) - the only write operation supported directly by
///   AtomicUnorderedInsertMap is findOrConstruct.  There is a (*) because
///   values aren't moved, so you can roll your own concurrency control for
///   in-place updates of values (see MutableData and MutableAtom below),
///   but the hash table itself doesn't help you.
///
/// * No resizing - you must specify the capacity up front, and once
///   the hash map gets full you won't be able to insert.  Insert
///   performance will degrade once the load factor is high.  Insert is
///   O(1/(1-actual_load_factor)).  Note that this is a pretty strong
///   limitation, because you can't remove existing keys.
///
/// * 2^30 maximum default capacity - by default AtomicUnorderedInsertMap
///   uses uint32_t internal indexes (and steals 2 bits), limiting you
///   to about a billion entries.  If you need more you can fill in all
///   of the template params so you change IndexType to uint64_t, or you
///   can use AtomicUnorderedInsertMap64.  64-bit indexes will increase
///   the space over of the map, of course.
///
/// WHAT YOU GET IN EXCHANGE:
///
/// * Arbitrary key and value types - any K and V that can be used in a
///   std::unordered_map can be used here.  In fact, the key and value
///   types don't even have to be copyable or moveable!
///
/// * Keys and values in the map won't be moved - it is safe to keep
///   pointers or references to the keys and values in the map, because
///   they are never moved or destroyed (until the map itself is destroyed).
///
/// * Iterators are never invalidated - writes don't invalidate iterators,
///   so you can scan and insert in parallel.
///
/// * Fast wait-free reads - reads are usually only a single cache miss,
///   even when the hash table is very large.  Wait-freedom means that
///   you won't see latency outliers even in the face of concurrent writes.
///
/// * Lock-free insert - writes proceed in parallel.  If a thread in the
///   middle of a write is unlucky and gets suspended, it doesn't block
///   anybody else.
///
/// COMMENTS ON INSERT-ONLY
///
/// This map provides wait-free linearizable reads and lock-free
/// linearizable inserts.  Inserted values won't be moved, but no
/// concurrency control is provided for safely updating them.  To remind
/// you of that fact they are only provided in const form.  This is the
/// only simple safe thing to do while preserving something like the normal
/// std::map iteration form, which requires that iteration be exposed
/// via std::pair (and prevents encapsulation of access to the value).
///
/// There are a couple of reasonable policies for doing in-place
/// concurrency control on the values.  I am hoping that the policy can
/// be injected via the value type or an extra template param, to keep
/// the core AtomicUnorderedInsertMap insert-only:
///
///   CONST: this is the currently implemented strategy, which is simple,
///   performant, and not that expressive.  You can always put in a value
///   with a mutable field (see MutableAtom below), but that doesn't look
///   as pretty as it should.
///
///   ATOMIC: for integers and integer-size trivially copyable structs
///   (via an adapter like tao/queues/AtomicStruct) the value can be a
///   std::atomic and read and written atomically.
///
///   SEQ-LOCK: attach a counter incremented before and after write.
///   Writers serialize by using CAS to make an even->odd transition,
///   then odd->even after the write.  Readers grab the value with memcpy,
///   checking sequence value before and after.  Readers retry until they
///   see an even sequence number that doesn't change.  This works for
///   larger structs, but still requires memcpy to be equivalent to copy
///   assignment, and it is no longer lock-free.  It scales very well,
///   because the readers are still invisible (no cache line writes).
///
///   LOCK: folly's SharedMutex would be a good choice here.
///
/// MEMORY ALLOCATION
///
/// Underlying memory is allocated as a big anonymous mmap chunk, which
/// might be cheaper than calloc() and is certainly not more expensive
/// for large maps.  If the SkipKeyValueDeletion template param is true
/// then deletion of the map consists of unmapping the backing memory,
/// which is much faster than destructing all of the keys and values.
/// Feel free to override if std::is_trivial_destructor isn't recognizing
/// the triviality of your destructors.
template <
    typename Key,
    typename Value,
    typename Hash = std::hash<Key>,
    typename KeyEqual = std::equal_to<Key>,
    bool SkipKeyValueDeletion =
        (boost::has_trivial_destructor<Key>::value &&
         boost::has_trivial_destructor<Value>::value),
    template <typename> class Atom = std::atomic,
    typename IndexType = uint32_t,
    typename Allocator = folly::detail::MMapAlloc>

struct AtomicUnorderedInsertMap {
  typedef Key key_type;
  typedef Value mapped_type;
  typedef std::pair<Key, Value> value_type;
  typedef std::size_t size_type;
  typedef std::ptrdiff_t difference_type;
  typedef Hash hasher;
  typedef KeyEqual key_equal;
  typedef const value_type& const_reference;

  typedef struct ConstIterator {
    ConstIterator(const AtomicUnorderedInsertMap& owner, IndexType slot)
        : owner_(owner), slot_(slot) {}

    ConstIterator(const ConstIterator&) = default;
    ConstIterator& operator=(const ConstIterator&) = default;

    const value_type& operator*() const {
      return owner_.slots_[slot_].keyValue();
    }

    const value_type* operator->() const {
      return &owner_.slots_[slot_].keyValue();
    }

    // pre-increment
    const ConstIterator& operator++() {
      while (slot_ > 0) {
        --slot_;
        if (owner_.slots_[slot_].state() == LINKED) {
          break;
        }
      }
      return *this;
    }

    // post-increment
    ConstIterator operator++(int /* dummy */) {
      auto prev = *this;
      ++*this;
      return prev;
    }

    bool operator==(const ConstIterator& rhs) const {
      return slot_ == rhs.slot_;
    }
    bool operator!=(const ConstIterator& rhs) const {
      return !(*this == rhs);
    }

   private:
    const AtomicUnorderedInsertMap& owner_;
    IndexType slot_;
  } const_iterator;

  friend ConstIterator;

  /// Constructs a map that will support the insertion of maxSize key-value
  /// pairs without exceeding the max load factor.  Load factors of greater
  /// than 1 are not supported, and once the actual load factor of the
  /// map approaches 1 the insert performance will suffer.  The capacity
  /// is limited to 2^30 (about a billion) for the default IndexType,
  /// beyond which we will throw invalid_argument.
  explicit AtomicUnorderedInsertMap(
      size_t maxSize,
      float maxLoadFactor = 0.8f,
      const Allocator& alloc = Allocator())
      : allocator_(alloc) {
    size_t capacity = size_t(maxSize / std::min(1.0f, maxLoadFactor) + 128);
    size_t avail = size_t{1} << (8 * sizeof(IndexType) - 2);
    if (capacity > avail && maxSize < avail) {
      // we'll do our best
      capacity = avail;
    }
    if (capacity < maxSize || capacity > avail) {
      throw std::invalid_argument(
          "AtomicUnorderedInsertMap capacity must fit in IndexType with 2 bits "
          "left over");
    }

    numSlots_ = capacity;
    slotMask_ = folly::nextPowTwo(capacity * 4) - 1;
    mmapRequested_ = sizeof(Slot) * capacity;
    slots_ = reinterpret_cast<Slot*>(allocator_.allocate(mmapRequested_));
    zeroFillSlots();
    // mark the zero-th slot as in-use but not valid, since that happens
    // to be our nil value
    slots_[0].stateUpdate(EMPTY, CONSTRUCTING);
  }

  ~AtomicUnorderedInsertMap() {
    if (!SkipKeyValueDeletion) {
      for (size_t i = 1; i < numSlots_; ++i) {
        slots_[i].~Slot();
      }
    }
    allocator_.deallocate(reinterpret_cast<char*>(slots_), mmapRequested_);
  }

  /// Searches for the key, returning (iter,false) if it is found.
  /// If it is not found calls the functor Func with a void* argument
  /// that is raw storage suitable for placement construction of a Value
  /// (see raw_value_type), then returns (iter,true).  May call Func and
  /// then return (iter,false) if there are other concurrent writes, in
  /// which case the newly constructed value will be immediately destroyed.
  ///
  /// This function does not block other readers or writers.  If there
  /// are other concurrent writes, many parallel calls to func may happen
  /// and only the first one to complete will win.  The values constructed
  /// by the other calls to func will be destroyed.
  ///
  /// Usage:
  ///
  ///  AtomicUnorderedInsertMap<std::string,std::string> memo;
  ///
  ///  auto value = memo.findOrConstruct(key, [=](void* raw) {
  ///    new (raw) std::string(computation(key));
  ///  })->first;
  template <typename Func>
  std::pair<const_iterator, bool> findOrConstruct(const Key& key, Func&& func) {
    auto const slot = keyToSlotIdx(key);
    auto prev = slots_[slot].headAndState_.load(std::memory_order_acquire);

    auto existing = find(key, slot);
    if (existing != 0) {
      return std::make_pair(ConstIterator(*this, existing), false);
    }

    auto idx = allocateNear(slot);
    new (&slots_[idx].keyValue().first) Key(key);
    func(static_cast<void*>(&slots_[idx].keyValue().second));

    while (true) {
      slots_[idx].next_ = prev >> 2;

      // we can merge the head update and the CONSTRUCTING -> LINKED update
      // into a single CAS if slot == idx (which should happen often)
      auto after = idx << 2;
      if (slot == idx) {
        after += LINKED;
      } else {
        after += (prev & 3);
      }

      if (slots_[slot].headAndState_.compare_exchange_strong(prev, after)) {
        // success
        if (idx != slot) {
          slots_[idx].stateUpdate(CONSTRUCTING, LINKED);
        }
        return std::make_pair(ConstIterator(*this, idx), true);
      }
      // compare_exchange_strong updates its first arg on failure, so
      // there is no need to reread prev

      existing = find(key, slot);
      if (existing != 0) {
        // our allocated key and value are no longer needed
        slots_[idx].keyValue().first.~Key();
        slots_[idx].keyValue().second.~Value();
        slots_[idx].stateUpdate(CONSTRUCTING, EMPTY);

        return std::make_pair(ConstIterator(*this, existing), false);
      }
    }
  }

  /// This isn't really emplace, but it is what we need to test.
  /// Eventually we can duplicate all of the std::pair constructor
  /// forms, including a recursive tuple forwarding template
  /// http://functionalcpp.wordpress.com/2013/08/28/tuple-forwarding/).
  template <class K, class V>
  std::pair<const_iterator, bool> emplace(const K& key, V&& value) {
    return findOrConstruct(
        key, [&](void* raw) { new (raw) Value(std::forward<V>(value)); });
  }

  const_iterator find(const Key& key) const {
    return ConstIterator(*this, find(key, keyToSlotIdx(key)));
  }

  const_iterator cbegin() const {
    IndexType slot = numSlots_ - 1;
    while (slot > 0 && slots_[slot].state() != LINKED) {
      --slot;
    }
    return ConstIterator(*this, slot);
  }

  const_iterator cend() const {
    return ConstIterator(*this, 0);
  }

 private:
  enum : IndexType {
    kMaxAllocationTries = 1000, // after this we throw
  };

  enum BucketState : IndexType {
    EMPTY = 0,
    CONSTRUCTING = 1,
    LINKED = 2,
  };

  /// Lock-free insertion is easiest by prepending to collision chains.
  /// A large chaining hash table takes two cache misses instead of
  /// one, however.  Our solution is to colocate the bucket storage and
  /// the head storage, so that even though we are traversing chains we
  /// are likely to stay within the same cache line.  Just make sure to
  /// traverse head before looking at any keys.  This strategy gives us
  /// 32 bit pointers and fast iteration.
  struct Slot {
    /// The bottom two bits are the BucketState, the rest is the index
    /// of the first bucket for the chain whose keys map to this slot.
    /// When things are going well the head usually links to this slot,
    /// but that doesn't always have to happen.
    Atom<IndexType> headAndState_;

    /// The next bucket in the chain
    IndexType next_;

    /// Key and Value
    typename std::aligned_storage<sizeof(value_type), alignof(value_type)>::type
        raw_;

    ~Slot() {
      auto s = state();
      assert(s == EMPTY || s == LINKED);
      if (s == LINKED) {
        keyValue().first.~Key();
        keyValue().second.~Value();
      }
    }

    BucketState state() const {
      return BucketState(headAndState_.load(std::memory_order_acquire) & 3);
    }

    void stateUpdate(BucketState before, BucketState after) {
      assert(state() == before);
      headAndState_ += (after - before);
    }

    value_type& keyValue() {
      assert(state() != EMPTY);
      return *static_cast<value_type*>(static_cast<void*>(&raw_));
    }

    const value_type& keyValue() const {
      assert(state() != EMPTY);
      return *static_cast<const value_type*>(static_cast<const void*>(&raw_));
    }
  };

  // We manually manage the slot memory so we can bypass initialization
  // (by getting a zero-filled mmap chunk) and optionally destruction of
  // the slots

  size_t mmapRequested_;
  size_t numSlots_;

  /// tricky, see keyToSlodIdx
  size_t slotMask_;

  Allocator allocator_;
  Slot* slots_;

  IndexType keyToSlotIdx(const Key& key) const {
    size_t h = hasher()(key);
    h &= slotMask_;
    while (h >= numSlots_) {
      h -= numSlots_;
    }
    return h;
  }

  IndexType find(const Key& key, IndexType slot) const {
    KeyEqual ke = {};
    auto hs = slots_[slot].headAndState_.load(std::memory_order_acquire);
    for (slot = hs >> 2; slot != 0; slot = slots_[slot].next_) {
      if (ke(key, slots_[slot].keyValue().first)) {
        return slot;
      }
    }
    return 0;
  }

  /// Allocates a slot and returns its index.  Tries to put it near
  /// slots_[start].
  IndexType allocateNear(IndexType start) {
    for (IndexType tries = 0; tries < kMaxAllocationTries; ++tries) {
      auto slot = allocationAttempt(start, tries);
      auto prev = slots_[slot].headAndState_.load(std::memory_order_acquire);
      if ((prev & 3) == EMPTY &&
          slots_[slot].headAndState_.compare_exchange_strong(
              prev, prev + CONSTRUCTING - EMPTY)) {
        return slot;
      }
    }
    throw std::bad_alloc();
  }

  /// Returns the slot we should attempt to allocate after tries failed
  /// tries, starting from the specified slot.  This is pulled out so we
  /// can specialize it differently during deterministic testing
  IndexType allocationAttempt(IndexType start, IndexType tries) const {
    if (LIKELY(tries < 8 && start + tries < numSlots_)) {
      return IndexType(start + tries);
    } else {
      IndexType rv;
      if (sizeof(IndexType) <= 4) {
        rv = IndexType(folly::Random::rand32(numSlots_));
      } else {
        rv = IndexType(folly::Random::rand64(numSlots_));
      }
      assert(rv < numSlots_);
      return rv;
    }
  }

  void zeroFillSlots() {
    using folly::detail::GivesZeroFilledMemory;
    if (!GivesZeroFilledMemory<Allocator>::value) {
      memset(slots_, 0, mmapRequested_);
    }
  }
};

/// AtomicUnorderedInsertMap64 is just a type alias that makes it easier
/// to select a 64 bit slot index type.  Use this if you need a capacity
/// bigger than 2^30 (about a billion).  This increases memory overheads,
/// obviously.
template <
    typename Key,
    typename Value,
    typename Hash = std::hash<Key>,
    typename KeyEqual = std::equal_to<Key>,
    bool SkipKeyValueDeletion =
        (boost::has_trivial_destructor<Key>::value &&
         boost::has_trivial_destructor<Value>::value),
    template <typename> class Atom = std::atomic,
    typename Allocator = folly::detail::MMapAlloc>
using AtomicUnorderedInsertMap64 = AtomicUnorderedInsertMap<
    Key,
    Value,
    Hash,
    KeyEqual,
    SkipKeyValueDeletion,
    Atom,
    uint64_t,
    Allocator>;

/// MutableAtom is a tiny wrapper than gives you the option of atomically
/// updating values inserted into an AtomicUnorderedInsertMap<K,
/// MutableAtom<V>>.  This relies on AtomicUnorderedInsertMap's guarantee
/// that it doesn't move values.
template <typename T, template <typename> class Atom = std::atomic>
struct MutableAtom {
  mutable Atom<T> data;

  explicit MutableAtom(const T& init) : data(init) {}
};

/// MutableData is a tiny wrapper than gives you the option of using an
/// external concurrency control mechanism to updating values inserted
/// into an AtomicUnorderedInsertMap.
template <typename T>
struct MutableData {
  mutable T data;
  explicit MutableData(const T& init) : data(init) {}
};

} // namespace folly
