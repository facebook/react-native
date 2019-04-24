/*
 * Copyright 2012-present Facebook, Inc.
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
 *  AtomicHashArray is the building block for AtomicHashMap.  It provides the
 *  core lock-free functionality, but is limited by the fact that it cannot
 *  grow past its initialization size and is a little more awkward (no public
 *  constructor, for example).  If you're confident that you won't run out of
 *  space, don't mind the awkardness, and really need bare-metal performance,
 *  feel free to use AHA directly.
 *
 *  Check out AtomicHashMap.h for more thorough documentation on perf and
 *  general pros and cons relative to other hash maps.
 *
 *  @author Spencer Ahrens <sahrens@fb.com>
 *  @author Jordan DeLong <delong.j@fb.com>
 */

#pragma once
#define FOLLY_ATOMICHASHARRAY_H_

#include <atomic>

#include <boost/iterator/iterator_facade.hpp>
#include <boost/noncopyable.hpp>

#include <folly/ThreadCachedInt.h>
#include <folly/Utility.h>
#include <folly/hash/Hash.h>

namespace folly {

struct AtomicHashArrayLinearProbeFcn {
  inline size_t operator()(size_t idx, size_t /* numProbes */, size_t capacity)
      const {
    idx += 1; // linear probing

    // Avoid modulus because it's slow
    return LIKELY(idx < capacity) ? idx : (idx - capacity);
  }
};

struct AtomicHashArrayQuadraticProbeFcn {
  inline size_t operator()(size_t idx, size_t numProbes, size_t capacity)
      const {
    idx += numProbes; // quadratic probing

    // Avoid modulus because it's slow
    return LIKELY(idx < capacity) ? idx : (idx - capacity);
  }
};

// Enables specializing checkLegalKey without specializing its class.
namespace detail {
template <typename NotKeyT, typename KeyT>
inline void checkLegalKeyIfKeyTImpl(
    NotKeyT /* ignored */,
    KeyT /* emptyKey */,
    KeyT /* lockedKey */,
    KeyT /* erasedKey */) {}

template <typename KeyT>
inline void checkLegalKeyIfKeyTImpl(
    KeyT key_in,
    KeyT emptyKey,
    KeyT lockedKey,
    KeyT erasedKey) {
  DCHECK_NE(key_in, emptyKey);
  DCHECK_NE(key_in, lockedKey);
  DCHECK_NE(key_in, erasedKey);
}
} // namespace detail

template <
    class KeyT,
    class ValueT,
    class HashFcn = std::hash<KeyT>,
    class EqualFcn = std::equal_to<KeyT>,
    class Allocator = std::allocator<char>,
    class ProbeFcn = AtomicHashArrayLinearProbeFcn,
    class KeyConvertFcn = Identity>
class AtomicHashMap;

template <
    class KeyT,
    class ValueT,
    class HashFcn = std::hash<KeyT>,
    class EqualFcn = std::equal_to<KeyT>,
    class Allocator = std::allocator<char>,
    class ProbeFcn = AtomicHashArrayLinearProbeFcn,
    class KeyConvertFcn = Identity>
class AtomicHashArray : boost::noncopyable {
  static_assert(
      (std::is_convertible<KeyT, int32_t>::value ||
       std::is_convertible<KeyT, int64_t>::value ||
       std::is_convertible<KeyT, const void*>::value),
      "You are trying to use AtomicHashArray with disallowed key "
      "types.  You must use atomically compare-and-swappable integer "
      "keys, or a different container class.");

 public:
  typedef KeyT key_type;
  typedef ValueT mapped_type;
  typedef HashFcn hasher;
  typedef EqualFcn key_equal;
  typedef KeyConvertFcn key_convert;
  typedef std::pair<const KeyT, ValueT> value_type;
  typedef std::size_t size_type;
  typedef std::ptrdiff_t difference_type;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef value_type* pointer;
  typedef const value_type* const_pointer;

  const size_t capacity_;
  const size_t maxEntries_;
  const KeyT kEmptyKey_;
  const KeyT kLockedKey_;
  const KeyT kErasedKey_;

  template <class ContT, class IterVal>
  struct aha_iterator;

  typedef aha_iterator<const AtomicHashArray, const value_type> const_iterator;
  typedef aha_iterator<AtomicHashArray, value_type> iterator;

  // You really shouldn't need this if you use the SmartPtr provided by create,
  // but if you really want to do something crazy like stick the released
  // pointer into a DescriminatedPtr or something, you'll need this to clean up
  // after yourself.
  static void destroy(AtomicHashArray*);

 private:
  const size_t kAnchorMask_;

  struct Deleter {
    void operator()(AtomicHashArray* ptr) {
      AtomicHashArray::destroy(ptr);
    }
  };

 public:
  typedef std::unique_ptr<AtomicHashArray, Deleter> SmartPtr;

  /*
   * create --
   *
   *   Creates AtomicHashArray objects.  Use instead of constructor/destructor.
   *
   *   We do things this way in order to avoid the perf penalty of a second
   *   pointer indirection when composing these into AtomicHashMap, which needs
   *   to store an array of pointers so that it can perform atomic operations on
   *   them when growing.
   *
   *   Instead of a mess of arguments, we take a max size and a Config struct to
   *   simulate named ctor parameters.  The Config struct has sensible defaults
   *   for everything, but is overloaded - if you specify a positive capacity,
   *   that will be used directly instead of computing it based on
   *   maxLoadFactor.
   *
   *   Create returns an AHA::SmartPtr which is a unique_ptr with a custom
   *   deleter to make sure everything is cleaned up properly.
   */
  struct Config {
    KeyT emptyKey;
    KeyT lockedKey;
    KeyT erasedKey;
    double maxLoadFactor;
    double growthFactor;
    uint32_t entryCountThreadCacheSize;
    size_t capacity; // if positive, overrides maxLoadFactor

    //  Cannot have constexpr ctor because some compilers rightly complain.
    Config()
        : emptyKey((KeyT)-1),
          lockedKey((KeyT)-2),
          erasedKey((KeyT)-3),
          maxLoadFactor(0.8),
          growthFactor(-1),
          entryCountThreadCacheSize(1000),
          capacity(0) {}
  };

  //  Cannot have pre-instantiated const Config instance because of SIOF.
  static SmartPtr create(size_t maxSize, const Config& c = Config());

  /*
   * find --
   *
   *
   *   Returns the iterator to the element if found, otherwise end().
   *
   *   As an optional feature, the type of the key to look up (LookupKeyT) is
   *   allowed to be different from the type of keys actually stored (KeyT).
   *
   *   This enables use cases where materializing the key is costly and usually
   *   redudant, e.g., canonicalizing/interning a set of strings and being able
   *   to look up by StringPiece. To use this feature, LookupHashFcn must take
   *   a LookupKeyT, and LookupEqualFcn must take KeyT and LookupKeyT as first
   *   and second parameter, respectively.
   *
   *   See folly/test/ArrayHashArrayTest.cpp for sample usage.
   */
  template <
      typename LookupKeyT = key_type,
      typename LookupHashFcn = hasher,
      typename LookupEqualFcn = key_equal>
  iterator find(LookupKeyT k) {
    return iterator(
        this, findInternal<LookupKeyT, LookupHashFcn, LookupEqualFcn>(k).idx);
  }

  template <
      typename LookupKeyT = key_type,
      typename LookupHashFcn = hasher,
      typename LookupEqualFcn = key_equal>
  const_iterator find(LookupKeyT k) const {
    return const_cast<AtomicHashArray*>(this)
        ->find<LookupKeyT, LookupHashFcn, LookupEqualFcn>(k);
  }

  /*
   * insert --
   *
   *   Returns a pair with iterator to the element at r.first and bool success.
   *   Retrieve the index with ret.first.getIndex().
   *
   *   Fails on key collision (does not overwrite) or if map becomes
   *   full, at which point no element is inserted, iterator is set to end(),
   *   and success is set false.  On collisions, success is set false, but the
   *   iterator is set to the existing entry.
   */
  std::pair<iterator, bool> insert(const value_type& r) {
    return emplace(r.first, r.second);
  }
  std::pair<iterator, bool> insert(value_type&& r) {
    return emplace(r.first, std::move(r.second));
  }

  /*
   * emplace --
   *
   *   Same contract as insert(), but performs in-place construction
   *   of the value type using the specified arguments.
   *
   *   Also, like find(), this method optionally allows 'key_in' to have a type
   *   different from that stored in the table; see find(). If and only if no
   *   equal key is already present, this method converts 'key_in' to a key of
   *   type KeyT using the provided LookupKeyToKeyFcn.
   */
  template <
      typename LookupKeyT = key_type,
      typename LookupHashFcn = hasher,
      typename LookupEqualFcn = key_equal,
      typename LookupKeyToKeyFcn = key_convert,
      typename... ArgTs>
  std::pair<iterator, bool> emplace(LookupKeyT key_in, ArgTs&&... vCtorArgs) {
    SimpleRetT ret = insertInternal<
        LookupKeyT,
        LookupHashFcn,
        LookupEqualFcn,
        LookupKeyToKeyFcn>(key_in, std::forward<ArgTs>(vCtorArgs)...);
    return std::make_pair(iterator(this, ret.idx), ret.success);
  }

  // returns the number of elements erased - should never exceed 1
  size_t erase(KeyT k);

  // clears all keys and values in the map and resets all counters.  Not thread
  // safe.
  void clear();

  // Exact number of elements in the map - note that readFull() acquires a
  // mutex.  See folly/ThreadCachedInt.h for more details.
  size_t size() const {
    return numEntries_.readFull() - numErases_.load(std::memory_order_relaxed);
  }

  bool empty() const {
    return size() == 0;
  }

  iterator begin() {
    iterator it(this, 0);
    it.advancePastEmpty();
    return it;
  }
  const_iterator begin() const {
    const_iterator it(this, 0);
    it.advancePastEmpty();
    return it;
  }

  iterator end() {
    return iterator(this, capacity_);
  }
  const_iterator end() const {
    return const_iterator(this, capacity_);
  }

  // See AtomicHashMap::findAt - access elements directly
  // WARNING: The following 2 functions will fail silently for hashtable
  // with capacity > 2^32
  iterator findAt(uint32_t idx) {
    DCHECK_LT(idx, capacity_);
    return iterator(this, idx);
  }
  const_iterator findAt(uint32_t idx) const {
    return const_cast<AtomicHashArray*>(this)->findAt(idx);
  }

  iterator makeIter(size_t idx) {
    return iterator(this, idx);
  }
  const_iterator makeIter(size_t idx) const {
    return const_iterator(this, idx);
  }

  // The max load factor allowed for this map
  double maxLoadFactor() const {
    return ((double)maxEntries_) / capacity_;
  }

  void setEntryCountThreadCacheSize(uint32_t newSize) {
    numEntries_.setCacheSize(newSize);
    numPendingEntries_.setCacheSize(newSize);
  }

  uint32_t getEntryCountThreadCacheSize() const {
    return numEntries_.getCacheSize();
  }

  /* Private data and helper functions... */

 private:
  friend class AtomicHashMap<
      KeyT,
      ValueT,
      HashFcn,
      EqualFcn,
      Allocator,
      ProbeFcn>;

  struct SimpleRetT {
    size_t idx;
    bool success;
    SimpleRetT(size_t i, bool s) : idx(i), success(s) {}
    SimpleRetT() = default;
  };

  template <
      typename LookupKeyT = key_type,
      typename LookupHashFcn = hasher,
      typename LookupEqualFcn = key_equal,
      typename LookupKeyToKeyFcn = Identity,
      typename... ArgTs>
  SimpleRetT insertInternal(LookupKeyT key, ArgTs&&... vCtorArgs);

  template <
      typename LookupKeyT = key_type,
      typename LookupHashFcn = hasher,
      typename LookupEqualFcn = key_equal>
  SimpleRetT findInternal(const LookupKeyT key);

  template <typename MaybeKeyT>
  void checkLegalKeyIfKey(MaybeKeyT key) {
    detail::checkLegalKeyIfKeyTImpl(key, kEmptyKey_, kLockedKey_, kErasedKey_);
  }

  static std::atomic<KeyT>* cellKeyPtr(const value_type& r) {
    // We need some illegal casting here in order to actually store
    // our value_type as a std::pair<const,>.  But a little bit of
    // undefined behavior never hurt anyone ...
    static_assert(
        sizeof(std::atomic<KeyT>) == sizeof(KeyT),
        "std::atomic is implemented in an unexpected way for AHM");
    return const_cast<std::atomic<KeyT>*>(
        reinterpret_cast<std::atomic<KeyT> const*>(&r.first));
  }

  static KeyT relaxedLoadKey(const value_type& r) {
    return cellKeyPtr(r)->load(std::memory_order_relaxed);
  }

  static KeyT acquireLoadKey(const value_type& r) {
    return cellKeyPtr(r)->load(std::memory_order_acquire);
  }

  // Fun with thread local storage - atomic increment is expensive
  // (relatively), so we accumulate in the thread cache and periodically
  // flush to the actual variable, and walk through the unflushed counts when
  // reading the value, so be careful of calling size() too frequently.  This
  // increases insertion throughput several times over while keeping the count
  // accurate.
  ThreadCachedInt<uint64_t> numEntries_; // Successful key inserts
  ThreadCachedInt<uint64_t> numPendingEntries_; // Used by insertInternal
  std::atomic<int64_t> isFull_; // Used by insertInternal
  std::atomic<int64_t> numErases_; // Successful key erases

  value_type cells_[0]; // This must be the last field of this class

  // Force constructor/destructor private since create/destroy should be
  // used externally instead
  AtomicHashArray(
      size_t capacity,
      KeyT emptyKey,
      KeyT lockedKey,
      KeyT erasedKey,
      double maxLoadFactor,
      uint32_t cacheSize);

  ~AtomicHashArray() = default;

  inline void unlockCell(value_type* const cell, KeyT newKey) {
    cellKeyPtr(*cell)->store(newKey, std::memory_order_release);
  }

  inline bool tryLockCell(value_type* const cell) {
    KeyT expect = kEmptyKey_;
    return cellKeyPtr(*cell)->compare_exchange_strong(
        expect, kLockedKey_, std::memory_order_acq_rel);
  }

  template <class LookupKeyT = key_type, class LookupHashFcn = hasher>
  inline size_t keyToAnchorIdx(const LookupKeyT k) const {
    const size_t hashVal = LookupHashFcn()(k);
    const size_t probe = hashVal & kAnchorMask_;
    return LIKELY(probe < capacity_) ? probe : hashVal % capacity_;
  }

}; // AtomicHashArray

} // namespace folly

#include <folly/AtomicHashArray-inl.h>
