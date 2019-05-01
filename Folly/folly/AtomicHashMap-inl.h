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

#ifndef FOLLY_ATOMICHASHMAP_H_
#error "This should only be included by AtomicHashMap.h"
#endif

#include <folly/detail/AtomicHashUtils.h>

namespace folly {

// AtomicHashMap constructor -- Atomic wrapper that allows growth
// This class has a lot of overhead (184 Bytes) so only use for big maps
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::AtomicHashMap(size_t finalSizeEst, const Config& config)
    : kGrowthFrac_(
          config.growthFactor < 0 ? 1.0f - config.maxLoadFactor
                                  : config.growthFactor) {
  CHECK(config.maxLoadFactor > 0.0f && config.maxLoadFactor < 1.0f);
  subMaps_[0].store(
      SubMap::create(finalSizeEst, config).release(),
      std::memory_order_relaxed);
  auto subMapCount = kNumSubMaps_;
  FOR_EACH_RANGE (i, 1, subMapCount) {
    subMaps_[i].store(nullptr, std::memory_order_relaxed);
  }
  numMapsAllocated_.store(1, std::memory_order_relaxed);
}

// emplace --
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <
    typename LookupKeyT,
    typename LookupHashFcn,
    typename LookupEqualFcn,
    typename LookupKeyToKeyFcn,
    typename... ArgTs>
std::pair<
    typename AtomicHashMap<
        KeyT,
        ValueT,
        HashFcn,
        EqualFcn,
        Allocator,
        ProbeFcn,
        KeyConvertFcn>::iterator,
    bool>
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::emplace(LookupKeyT k, ArgTs&&... vCtorArgs) {
  SimpleRetT ret = insertInternal<
      LookupKeyT,
      LookupHashFcn,
      LookupEqualFcn,
      LookupKeyToKeyFcn>(k, std::forward<ArgTs>(vCtorArgs)...);
  SubMap* subMap = subMaps_[ret.i].load(std::memory_order_relaxed);
  return std::make_pair(
      iterator(this, ret.i, subMap->makeIter(ret.j)), ret.success);
}

// insertInternal -- Allocates new sub maps as existing ones fill up.
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <
    typename LookupKeyT,
    typename LookupHashFcn,
    typename LookupEqualFcn,
    typename LookupKeyToKeyFcn,
    typename... ArgTs>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::SimpleRetT
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::insertInternal(LookupKeyT key, ArgTs&&... vCtorArgs) {
beginInsertInternal:
  auto nextMapIdx = // this maintains our state
      numMapsAllocated_.load(std::memory_order_acquire);
  typename SubMap::SimpleRetT ret;
  FOR_EACH_RANGE (i, 0, nextMapIdx) {
    // insert in each map successively.  If one succeeds, we're done!
    SubMap* subMap = subMaps_[i].load(std::memory_order_relaxed);
    ret = subMap->template insertInternal<
        LookupKeyT,
        LookupHashFcn,
        LookupEqualFcn,
        LookupKeyToKeyFcn>(key, std::forward<ArgTs>(vCtorArgs)...);
    if (ret.idx == subMap->capacity_) {
      continue; // map is full, so try the next one
    }
    // Either collision or success - insert in either case
    return SimpleRetT(i, ret.idx, ret.success);
  }

  // If we made it this far, all maps are full and we need to try to allocate
  // the next one.

  SubMap* primarySubMap = subMaps_[0].load(std::memory_order_relaxed);
  if (nextMapIdx >= kNumSubMaps_ ||
      primarySubMap->capacity_ * kGrowthFrac_ < 1.0) {
    // Can't allocate any more sub maps.
    throw AtomicHashMapFullError();
  }

  if (tryLockMap(nextMapIdx)) {
    // Alloc a new map and shove it in.  We can change whatever
    // we want because other threads are waiting on us...
    size_t numCellsAllocated = (size_t)(
        primarySubMap->capacity_ *
        std::pow(1.0 + kGrowthFrac_, nextMapIdx - 1));
    size_t newSize = size_t(numCellsAllocated * kGrowthFrac_);
    DCHECK(
        subMaps_[nextMapIdx].load(std::memory_order_relaxed) ==
        (SubMap*)kLockedPtr_);
    // create a new map using the settings stored in the first map

    Config config;
    config.emptyKey = primarySubMap->kEmptyKey_;
    config.lockedKey = primarySubMap->kLockedKey_;
    config.erasedKey = primarySubMap->kErasedKey_;
    config.maxLoadFactor = primarySubMap->maxLoadFactor();
    config.entryCountThreadCacheSize =
        primarySubMap->getEntryCountThreadCacheSize();
    subMaps_[nextMapIdx].store(
        SubMap::create(newSize, config).release(), std::memory_order_relaxed);

    // Publish the map to other threads.
    numMapsAllocated_.fetch_add(1, std::memory_order_release);
    DCHECK_EQ(
        nextMapIdx + 1, numMapsAllocated_.load(std::memory_order_relaxed));
  } else {
    // If we lost the race, we'll have to wait for the next map to get
    // allocated before doing any insertion here.
    detail::atomic_hash_spin_wait([&] {
      return nextMapIdx >= numMapsAllocated_.load(std::memory_order_acquire);
    });
  }

  // Relaxed is ok here because either we just created this map, or we
  // just did a spin wait with an acquire load on numMapsAllocated_.
  SubMap* loadedMap = subMaps_[nextMapIdx].load(std::memory_order_relaxed);
  DCHECK(loadedMap && loadedMap != (SubMap*)kLockedPtr_);
  ret = loadedMap->insertInternal(key, std::forward<ArgTs>(vCtorArgs)...);
  if (ret.idx != loadedMap->capacity_) {
    return SimpleRetT(nextMapIdx, ret.idx, ret.success);
  }
  // We took way too long and the new map is already full...try again from
  // the top (this should pretty much never happen).
  goto beginInsertInternal;
}

// find --
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <class LookupKeyT, class LookupHashFcn, class LookupEqualFcn>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::iterator
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::find(LookupKeyT k) {
  SimpleRetT ret = findInternal<LookupKeyT, LookupHashFcn, LookupEqualFcn>(k);
  if (!ret.success) {
    return end();
  }
  SubMap* subMap = subMaps_[ret.i].load(std::memory_order_relaxed);
  return iterator(this, ret.i, subMap->makeIter(ret.j));
}

template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <class LookupKeyT, class LookupHashFcn, class LookupEqualFcn>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::const_iterator
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::find(LookupKeyT k) const {
  return const_cast<AtomicHashMap*>(this)
      ->find<LookupKeyT, LookupHashFcn, LookupEqualFcn>(k);
}

// findInternal --
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <class LookupKeyT, class LookupHashFcn, class LookupEqualFcn>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::SimpleRetT
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::findInternal(const LookupKeyT k) const {
  SubMap* const primaryMap = subMaps_[0].load(std::memory_order_relaxed);
  typename SubMap::SimpleRetT ret =
      primaryMap
          ->template findInternal<LookupKeyT, LookupHashFcn, LookupEqualFcn>(k);
  if (LIKELY(ret.idx != primaryMap->capacity_)) {
    return SimpleRetT(0, ret.idx, ret.success);
  }
  const unsigned int numMaps =
      numMapsAllocated_.load(std::memory_order_acquire);
  FOR_EACH_RANGE (i, 1, numMaps) {
    // Check each map successively.  If one succeeds, we're done!
    SubMap* thisMap = subMaps_[i].load(std::memory_order_relaxed);
    ret =
        thisMap
            ->template findInternal<LookupKeyT, LookupHashFcn, LookupEqualFcn>(
                k);
    if (LIKELY(ret.idx != thisMap->capacity_)) {
      return SimpleRetT(i, ret.idx, ret.success);
    }
  }
  // Didn't find our key...
  return SimpleRetT(numMaps, 0, false);
}

// findAtInternal -- see encodeIndex() for details.
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::SimpleRetT
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::findAtInternal(uint32_t idx) const {
  uint32_t subMapIdx, subMapOffset;
  if (idx & kSecondaryMapBit_) {
    // idx falls in a secondary map
    idx &= ~kSecondaryMapBit_; // unset secondary bit
    subMapIdx = idx >> kSubMapIndexShift_;
    DCHECK_LT(subMapIdx, numMapsAllocated_.load(std::memory_order_relaxed));
    subMapOffset = idx & kSubMapIndexMask_;
  } else {
    // idx falls in primary map
    subMapIdx = 0;
    subMapOffset = idx;
  }
  return SimpleRetT(subMapIdx, subMapOffset, true);
}

// erase --
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
typename AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::size_type
AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::erase(const KeyT k) {
  int const numMaps = numMapsAllocated_.load(std::memory_order_acquire);
  FOR_EACH_RANGE (i, 0, numMaps) {
    // Check each map successively.  If one succeeds, we're done!
    if (subMaps_[i].load(std::memory_order_relaxed)->erase(k)) {
      return 1;
    }
  }
  // Didn't find our key...
  return 0;
}

// capacity -- summation of capacities of all submaps
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
size_t AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::capacity() const {
  size_t totalCap(0);
  int const numMaps = numMapsAllocated_.load(std::memory_order_acquire);
  FOR_EACH_RANGE (i, 0, numMaps) {
    totalCap += subMaps_[i].load(std::memory_order_relaxed)->capacity_;
  }
  return totalCap;
}

// spaceRemaining --
// number of new insertions until current submaps are all at max load
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
size_t AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::spaceRemaining() const {
  size_t spaceRem(0);
  int const numMaps = numMapsAllocated_.load(std::memory_order_acquire);
  FOR_EACH_RANGE (i, 0, numMaps) {
    SubMap* thisMap = subMaps_[i].load(std::memory_order_relaxed);
    spaceRem +=
        std::max(0, thisMap->maxEntries_ - &thisMap->numEntries_.readFull());
  }
  return spaceRem;
}

// clear -- Wipes all keys and values from primary map and destroys
// all secondary maps.  Not thread safe.
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
void AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::clear() {
  subMaps_[0].load(std::memory_order_relaxed)->clear();
  int const numMaps = numMapsAllocated_.load(std::memory_order_relaxed);
  FOR_EACH_RANGE (i, 1, numMaps) {
    SubMap* thisMap = subMaps_[i].load(std::memory_order_relaxed);
    DCHECK(thisMap);
    SubMap::destroy(thisMap);
    subMaps_[i].store(nullptr, std::memory_order_relaxed);
  }
  numMapsAllocated_.store(1, std::memory_order_relaxed);
}

// size --
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
size_t AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::size() const {
  size_t totalSize(0);
  int const numMaps = numMapsAllocated_.load(std::memory_order_acquire);
  FOR_EACH_RANGE (i, 0, numMaps) {
    totalSize += subMaps_[i].load(std::memory_order_relaxed)->size();
  }
  return totalSize;
}

// encodeIndex -- Encode the submap index and offset into return.
// index_ret must be pre-populated with the submap offset.
//
// We leave index_ret untouched when referring to the primary map
// so it can be as large as possible (31 data bits).  Max size of
// secondary maps is limited by what can fit in the low 27 bits.
//
// Returns the following bit-encoded data in index_ret:
//   if subMap == 0 (primary map) =>
//     bit(s)          value
//         31              0
//       0-30  submap offset (index_ret input)
//
//   if subMap > 0 (secondary maps) =>
//     bit(s)          value
//         31              1
//      27-30   which subMap
//       0-26  subMap offset (index_ret input)
template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
inline uint32_t AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::encodeIndex(uint32_t subMap, uint32_t offset) {
  DCHECK_EQ(offset & kSecondaryMapBit_, 0); // offset can't be too big
  if (subMap == 0) {
    return offset;
  }
  // Make sure subMap isn't too big
  DCHECK_EQ(subMap >> kNumSubMapBits_, 0);
  // Make sure subMap bits of offset are clear
  DCHECK_EQ(offset & (~kSubMapIndexMask_ | kSecondaryMapBit_), 0);

  // Set high-order bits to encode which submap this index belongs to
  return offset | (subMap << kSubMapIndexShift_) | kSecondaryMapBit_;
}

// Iterator implementation

template <
    typename KeyT,
    typename ValueT,
    typename HashFcn,
    typename EqualFcn,
    typename Allocator,
    typename ProbeFcn,
    typename KeyConvertFcn>
template <class ContT, class IterVal, class SubIt>
struct AtomicHashMap<
    KeyT,
    ValueT,
    HashFcn,
    EqualFcn,
    Allocator,
    ProbeFcn,
    KeyConvertFcn>::ahm_iterator
    : boost::iterator_facade<
          ahm_iterator<ContT, IterVal, SubIt>,
          IterVal,
          boost::forward_traversal_tag> {
  explicit ahm_iterator() : ahm_(nullptr) {}

  // Conversion ctor for interoperability between const_iterator and
  // iterator.  The enable_if<> magic keeps us well-behaved for
  // is_convertible<> (v. the iterator_facade documentation).
  template <class OtherContT, class OtherVal, class OtherSubIt>
  ahm_iterator(
      const ahm_iterator<OtherContT, OtherVal, OtherSubIt>& o,
      typename std::enable_if<
          std::is_convertible<OtherSubIt, SubIt>::value>::type* = nullptr)
      : ahm_(o.ahm_), subMap_(o.subMap_), subIt_(o.subIt_) {}

  /*
   * Returns the unique index that can be used for access directly
   * into the data storage.
   */
  uint32_t getIndex() const {
    CHECK(!isEnd());
    return ahm_->encodeIndex(subMap_, subIt_.getIndex());
  }

 private:
  friend class AtomicHashMap;
  explicit ahm_iterator(ContT* ahm, uint32_t subMap, const SubIt& subIt)
      : ahm_(ahm), subMap_(subMap), subIt_(subIt) {}

  friend class boost::iterator_core_access;

  void increment() {
    CHECK(!isEnd());
    ++subIt_;
    checkAdvanceToNextSubmap();
  }

  bool equal(const ahm_iterator& other) const {
    if (ahm_ != other.ahm_) {
      return false;
    }

    if (isEnd() || other.isEnd()) {
      return isEnd() == other.isEnd();
    }

    return subMap_ == other.subMap_ && subIt_ == other.subIt_;
  }

  IterVal& dereference() const {
    return *subIt_;
  }

  bool isEnd() const {
    return ahm_ == nullptr;
  }

  void checkAdvanceToNextSubmap() {
    if (isEnd()) {
      return;
    }

    SubMap* thisMap = ahm_->subMaps_[subMap_].load(std::memory_order_relaxed);
    while (subIt_ == thisMap->end()) {
      // This sub iterator is done, advance to next one
      if (subMap_ + 1 <
          ahm_->numMapsAllocated_.load(std::memory_order_acquire)) {
        ++subMap_;
        thisMap = ahm_->subMaps_[subMap_].load(std::memory_order_relaxed);
        subIt_ = thisMap->begin();
      } else {
        ahm_ = nullptr;
        return;
      }
    }
  }

 private:
  ContT* ahm_;
  uint32_t subMap_;
  SubIt subIt_;
}; // ahm_iterator

} // namespace folly
