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

// @author: Xin Liu <xliux@fb.com>

#pragma once

#include <algorithm>
#include <atomic>
#include <climits>
#include <cmath>
#include <memory>
#include <mutex>
#include <type_traits>
#include <vector>

#include <boost/noncopyable.hpp>
#include <boost/random.hpp>
#include <boost/type_traits.hpp>
#include <glog/logging.h>

#include <folly/Memory.h>
#include <folly/ThreadLocal.h>
#include <folly/synchronization/MicroSpinLock.h>

namespace folly {
namespace detail {

template <typename ValT, typename NodeT>
class csl_iterator;

template <typename T>
class SkipListNode : private boost::noncopyable {
  enum : uint16_t {
    IS_HEAD_NODE = 1,
    MARKED_FOR_REMOVAL = (1 << 1),
    FULLY_LINKED = (1 << 2),
  };

 public:
  typedef T value_type;

  template <
      typename NodeAlloc,
      typename U,
      typename =
          typename std::enable_if<std::is_convertible<U, T>::value>::type>
  static SkipListNode*
  create(NodeAlloc& alloc, int height, U&& data, bool isHead = false) {
    DCHECK(height >= 1 && height < 64) << height;

    size_t size =
        sizeof(SkipListNode) + height * sizeof(std::atomic<SkipListNode*>);
    auto storage = std::allocator_traits<NodeAlloc>::allocate(alloc, size);
    // do placement new
    return new (storage)
        SkipListNode(uint8_t(height), std::forward<U>(data), isHead);
  }

  template <typename NodeAlloc>
  static void destroy(NodeAlloc& alloc, SkipListNode* node) {
    size_t size = sizeof(SkipListNode) +
        node->height_ * sizeof(std::atomic<SkipListNode*>);
    node->~SkipListNode();
    std::allocator_traits<NodeAlloc>::deallocate(alloc, node, size);
  }

  template <typename NodeAlloc>
  struct DestroyIsNoOp : StrictConjunction<
                             AllocatorHasTrivialDeallocate<NodeAlloc>,
                             boost::has_trivial_destructor<SkipListNode>> {};

  // copy the head node to a new head node assuming lock acquired
  SkipListNode* copyHead(SkipListNode* node) {
    DCHECK(node != nullptr && height_ > node->height_);
    setFlags(node->getFlags());
    for (uint8_t i = 0; i < node->height_; ++i) {
      setSkip(i, node->skip(i));
    }
    return this;
  }

  inline SkipListNode* skip(int layer) const {
    DCHECK_LT(layer, height_);
    return skip_[layer].load(std::memory_order_consume);
  }

  // next valid node as in the linked list
  SkipListNode* next() {
    SkipListNode* node;
    for (node = skip(0); (node != nullptr && node->markedForRemoval());
         node = node->skip(0)) {
    }
    return node;
  }

  void setSkip(uint8_t h, SkipListNode* next) {
    DCHECK_LT(h, height_);
    skip_[h].store(next, std::memory_order_release);
  }

  value_type& data() {
    return data_;
  }
  const value_type& data() const {
    return data_;
  }
  int maxLayer() const {
    return height_ - 1;
  }
  int height() const {
    return height_;
  }

  std::unique_lock<MicroSpinLock> acquireGuard() {
    return std::unique_lock<MicroSpinLock>(spinLock_);
  }

  bool fullyLinked() const {
    return getFlags() & FULLY_LINKED;
  }
  bool markedForRemoval() const {
    return getFlags() & MARKED_FOR_REMOVAL;
  }
  bool isHeadNode() const {
    return getFlags() & IS_HEAD_NODE;
  }

  void setIsHeadNode() {
    setFlags(uint16_t(getFlags() | IS_HEAD_NODE));
  }
  void setFullyLinked() {
    setFlags(uint16_t(getFlags() | FULLY_LINKED));
  }
  void setMarkedForRemoval() {
    setFlags(uint16_t(getFlags() | MARKED_FOR_REMOVAL));
  }

 private:
  // Note! this can only be called from create() as a placement new.
  template <typename U>
  SkipListNode(uint8_t height, U&& data, bool isHead)
      : height_(height), data_(std::forward<U>(data)) {
    spinLock_.init();
    setFlags(0);
    if (isHead) {
      setIsHeadNode();
    }
    // need to explicitly init the dynamic atomic pointer array
    for (uint8_t i = 0; i < height_; ++i) {
      new (&skip_[i]) std::atomic<SkipListNode*>(nullptr);
    }
  }

  ~SkipListNode() {
    for (uint8_t i = 0; i < height_; ++i) {
      skip_[i].~atomic();
    }
  }

  uint16_t getFlags() const {
    return flags_.load(std::memory_order_consume);
  }
  void setFlags(uint16_t flags) {
    flags_.store(flags, std::memory_order_release);
  }

  // TODO(xliu): on x86_64, it's possible to squeeze these into
  // skip_[0] to maybe save 8 bytes depending on the data alignments.
  // NOTE: currently this is x86_64 only anyway, due to the
  // MicroSpinLock.
  std::atomic<uint16_t> flags_;
  const uint8_t height_;
  MicroSpinLock spinLock_;

  value_type data_;

  std::atomic<SkipListNode*> skip_[0];
};

class SkipListRandomHeight {
  enum { kMaxHeight = 64 };

 public:
  // make it a singleton.
  static SkipListRandomHeight* instance() {
    static SkipListRandomHeight instance_;
    return &instance_;
  }

  int getHeight(int maxHeight) const {
    DCHECK_LE(maxHeight, kMaxHeight) << "max height too big!";
    double p = randomProb();
    for (int i = 0; i < maxHeight; ++i) {
      if (p < lookupTable_[i]) {
        return i + 1;
      }
    }
    return maxHeight;
  }

  size_t getSizeLimit(int height) const {
    DCHECK_LT(height, kMaxHeight);
    return sizeLimitTable_[height];
  }

 private:
  SkipListRandomHeight() {
    initLookupTable();
  }

  void initLookupTable() {
    // set skip prob = 1/E
    static const double kProbInv = exp(1);
    static const double kProb = 1.0 / kProbInv;
    static const size_t kMaxSizeLimit = std::numeric_limits<size_t>::max();

    double sizeLimit = 1;
    double p = lookupTable_[0] = (1 - kProb);
    sizeLimitTable_[0] = 1;
    for (int i = 1; i < kMaxHeight - 1; ++i) {
      p *= kProb;
      sizeLimit *= kProbInv;
      lookupTable_[i] = lookupTable_[i - 1] + p;
      sizeLimitTable_[i] = sizeLimit > kMaxSizeLimit
          ? kMaxSizeLimit
          : static_cast<size_t>(sizeLimit);
    }
    lookupTable_[kMaxHeight - 1] = 1;
    sizeLimitTable_[kMaxHeight - 1] = kMaxSizeLimit;
  }

  static double randomProb() {
    static ThreadLocal<boost::lagged_fibonacci2281> rng_;
    return (*rng_)();
  }

  double lookupTable_[kMaxHeight];
  size_t sizeLimitTable_[kMaxHeight];
};

template <typename NodeType, typename NodeAlloc, typename = void>
class NodeRecycler;

template <typename NodeType, typename NodeAlloc>
class NodeRecycler<
    NodeType,
    NodeAlloc,
    typename std::enable_if<
        !NodeType::template DestroyIsNoOp<NodeAlloc>::value>::type> {
 public:
  explicit NodeRecycler(const NodeAlloc& alloc)
      : refs_(0), dirty_(false), alloc_(alloc) {
    lock_.init();
  }

  explicit NodeRecycler() : refs_(0), dirty_(false) {
    lock_.init();
  }

  ~NodeRecycler() {
    CHECK_EQ(refs(), 0);
    if (nodes_) {
      for (auto& node : *nodes_) {
        NodeType::destroy(alloc_, node);
      }
    }
  }

  void add(NodeType* node) {
    std::lock_guard<MicroSpinLock> g(lock_);
    if (nodes_.get() == nullptr) {
      nodes_ = std::make_unique<std::vector<NodeType*>>(1, node);
    } else {
      nodes_->push_back(node);
    }
    DCHECK_GT(refs(), 0);
    dirty_.store(true, std::memory_order_relaxed);
  }

  int addRef() {
    return refs_.fetch_add(1, std::memory_order_relaxed);
  }

  int releaseRef() {
    // We don't expect to clean the recycler immediately everytime it is OK
    // to do so. Here, it is possible that multiple accessors all release at
    // the same time but nobody would clean the recycler here. If this
    // happens, the recycler will usually still get cleaned when
    // such a race doesn't happen. The worst case is the recycler will
    // eventually get deleted along with the skiplist.
    if (LIKELY(!dirty_.load(std::memory_order_relaxed) || refs() > 1)) {
      return refs_.fetch_add(-1, std::memory_order_relaxed);
    }

    std::unique_ptr<std::vector<NodeType*>> newNodes;
    {
      std::lock_guard<MicroSpinLock> g(lock_);
      if (nodes_.get() == nullptr || refs() > 1) {
        return refs_.fetch_add(-1, std::memory_order_relaxed);
      }
      // once refs_ reaches 1 and there is no other accessor, it is safe to
      // remove all the current nodes in the recycler, as we already acquired
      // the lock here so no more new nodes can be added, even though new
      // accessors may be added after that.
      newNodes.swap(nodes_);
      dirty_.store(false, std::memory_order_relaxed);
    }

    // TODO(xliu) should we spawn a thread to do this when there are large
    // number of nodes in the recycler?
    for (auto& node : *newNodes) {
      NodeType::destroy(alloc_, node);
    }

    // decrease the ref count at the very end, to minimize the
    // chance of other threads acquiring lock_ to clear the deleted
    // nodes again.
    return refs_.fetch_add(-1, std::memory_order_relaxed);
  }

  NodeAlloc& alloc() {
    return alloc_;
  }

 private:
  int refs() const {
    return refs_.load(std::memory_order_relaxed);
  }

  std::unique_ptr<std::vector<NodeType*>> nodes_;
  std::atomic<int32_t> refs_; // current number of visitors to the list
  std::atomic<bool> dirty_; // whether *nodes_ is non-empty
  MicroSpinLock lock_; // protects access to *nodes_
  NodeAlloc alloc_;
};

// In case of arena allocator, no recycling is necessary, and it's possible
// to save on ConcurrentSkipList size.
template <typename NodeType, typename NodeAlloc>
class NodeRecycler<
    NodeType,
    NodeAlloc,
    typename std::enable_if<
        NodeType::template DestroyIsNoOp<NodeAlloc>::value>::type> {
 public:
  explicit NodeRecycler(const NodeAlloc& alloc) : alloc_(alloc) {}

  void addRef() {}
  void releaseRef() {}

  void add(NodeType* /* node */) {}

  NodeAlloc& alloc() {
    return alloc_;
  }

 private:
  NodeAlloc alloc_;
};

} // namespace detail
} // namespace folly
