/*
 * Copyright 2018-present Facebook, Inc.
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

#include <algorithm>
#include <atomic>
#include <climits>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <mutex>

#include <folly/Random.h>
#include <folly/SpinLock.h>
#include <folly/ThreadLocal.h>
#include <folly/detail/Futex.h>
#include <folly/lang/Align.h>
#include <folly/synchronization/Hazptr.h>
#include <folly/synchronization/WaitOptions.h>
#include <folly/synchronization/detail/Spin.h>

/// ------ Concurrent Priority Queue Implementation ------
// The concurrent priority queue implementation is based on the
// Mound data structure (Mounds: Array-Based Concurrent Priority Queues
// by Yujie Liu and Michael Spear, ICPP 2012)
//
/// --- Overview ---
// This relaxed implementation extends the Mound algorithm, and provides
// following features:
// - Arbitrary priorities.
// - Unbounded size.
// - Push, pop, empty, size functions. [TODO: Non-waiting and timed wait pop]
// - Supports blocking.
// - Fast and Scalable.
//
/// --- Mound ---
// A Mound is a heap where each element is a sorted linked list.
// First nodes in the lists maintain the heap property. Push randomly
// selects a leaf at the bottom level, then uses binary search to find
// a place to insert the new node to the head of the list. Pop gets
// the node from the head of the list at the root, then swap the
// list down until the heap feature holds. To use Mound in our
// implementation, we need to solve the following problems:
// - 1. Lack of general relaxed implementations. Mound is appealing
// for relaxed priority queue implementation because pop the whole
// list from the root is straightforward. One thread pops the list
// and following threads can pop from the list until its empty.
// Those pops only trigger one swap done operation. Thus reduce
// the latency for pop and reduce the contention for Mound.
// The difficulty is to provide a scalable and fast mechanism
// to let threads concurrently get elements from the list.
// - 2. Lack of control of list length. The length for every
// lists is critical for the performance. Mound suffers from not
// only the extreme cases(Push with increasing priorities, Mound
// becomes a sorted linked list; Push with decreasing priorities,
// Mound becomes to a regular heap), but also the common case(for
// random generated priorities, Mound degrades to the regular heap
// after millions of push/pop operations). The difficulty is to
// stabilize the list length without losing the accuracy and performance.
// - 3. Does not support blocking. Blocking is an important feature.
// Mound paper does not mention it. Designing the new algorithm for
// efficient blocking is challenging.
// - 4. Memory management. Mound allows optimistic reads. We need to
// protect the node from been reclaimed.
//
/// --- Design ---
// Our implementation extends Mound algorithm to support
// efficient relaxed pop. We employ a shared buffer algorithm to
// share the popped list. Our algorithm makes popping from shared
// buffer as fast as fetch_and_add. We improve the performance
// and compact the heap structure by stabilizing the size of each list.
// The implementation exposes the template parameter to set the
// preferred list length. Under the hood, we provide algorithms for
// fast inserting, pruning, and merging. The blocking algorithm is
// tricky. It allows one producer only wakes one consumer at a time.
// It also does not block the producer. For optimistic read, we use
// hazard pointer to protect the node from been reclaimed. We optimize the
// check-lock-check pattern by using test-test-and-set spin lock.

/// --- Template Parameters: ---
// 1. PopBatch could be 0 or a positive integer.
// If it is 0, only pop one node at a time.
// This is the strict implementation. It guarantees the return
// priority is alway the highest.  If it is > 0, we keep
// up to that number of nodes in a shared buffer to be consumed by
// subsequent pop operations.
//
// 2. ListTargetSize represents the minimal length for the list. It
// solves the problem when inserting to Mound with
// decreasing priority order (degrade to a heap).  Moreover,
// it maintains the Mound structure stable after trillions of
// operations, which causes unbalanced problem in the original
// Mound algorithm. We set the prunning length and merging lengtyh
// based on this parameter.
//
/// --- Interface ---
//  void push(const T& val)
//  void pop(T& val)
//  size_t size()
//  bool empty()

namespace folly {

template <
    typename T,
    bool MayBlock = false,
    bool SupportsSize = false,
    size_t PopBatch = 16,
    size_t ListTargetSize = 25,
    typename Mutex = folly::SpinLock,
    template <typename> class Atom = std::atomic>
class RelaxedConcurrentPriorityQueue {
  // Max height of the tree
  static constexpr uint32_t MAX_LEVELS = 32;
  // The default minimum value
  static constexpr T MIN_VALUE = std::numeric_limits<T>::min();

  // Align size for the shared buffer node
  static constexpr size_t Align = 1u << 7;
  static constexpr int LevelForForceInsert = 3;
  static constexpr int LevelForTraverseParent = 7;

  static_assert(PopBatch <= 256, "PopBatch must be <= 256");
  static_assert(
      ListTargetSize >= 1 && ListTargetSize <= 256,
      "TargetSize must be in the range [1, 256]");

  // The maximal length for the list
  static constexpr size_t PruningSize = ListTargetSize * 2;
  // When pop from Mound, tree elements near the leaf
  // level are likely be very small (the length of the list). When
  // swapping down after pop a list, we check the size of the
  // children to decide whether to merge them to their parent.
  static constexpr size_t MergingSize = ListTargetSize;

  /// List Node structure
  struct Node : public folly::hazptr_obj_base<Node, Atom> {
    Node* next;
    T val;
  };

  /// Mound Element (Tree node), head points to a linked list
  struct MoundElement {
    // Reading (head, size) without acquiring the lock
    Atom<Node*> head;
    Atom<size_t> size;
    alignas(Align) Mutex lock;
    MoundElement() { // initializer
      head.store(nullptr, std::memory_order_relaxed);
      size.store(0, std::memory_order_relaxed);
    }
  };

  /// The pos strcture simplify the implementation
  struct Position {
    uint32_t level;
    uint32_t index;
  };

  /// Node for shared buffer should be aligned
  struct BufferNode {
    alignas(Align) Atom<Node*> pnode;
  };

  /// Data members

  // Mound structure -> 2D array to represent a tree
  MoundElement* levels_[MAX_LEVELS];
  // Record the current leaf level (root is 0)
  Atom<uint32_t> bottom_;
  // It is used when expanding the tree
  Atom<uint32_t> guard_;

  // Mound with shared buffer
  // Following two members are accessed by consumers
  std::unique_ptr<BufferNode[]> shared_buffer_;
  alignas(Align) Atom<int> top_loc_;

  /// Blocking algorithm
  // Numbers of futexs in the array
  static constexpr size_t NumFutex = 128;
  // The index gap for accessing futex in the array
  static constexpr size_t Stride = 33;
  std::unique_ptr<folly::detail::Futex<Atom>[]> futex_array_;
  alignas(Align) Atom<uint32_t> cticket_;
  alignas(Align) Atom<uint32_t> pticket_;

  // Two counters to calculate size of the queue
  alignas(Align) Atom<size_t> counter_p_;
  alignas(Align) Atom<size_t> counter_c_;

 public:
  /// Constructor
  RelaxedConcurrentPriorityQueue()
      : cticket_(1), pticket_(1), counter_p_(0), counter_c_(0) {
    if (MayBlock) {
      futex_array_.reset(new folly::detail::Futex<Atom>[NumFutex]);
    }

    if (PopBatch > 0) {
      top_loc_ = -1;
      shared_buffer_.reset(new BufferNode[PopBatch]);
      for (size_t i = 0; i < PopBatch; i++) {
        shared_buffer_[i].pnode = nullptr;
      }
    }
    bottom_.store(0, std::memory_order_relaxed);
    guard_.store(0, std::memory_order_relaxed);
    // allocate the root MoundElement and initialize Mound
    levels_[0] = new MoundElement[1]; // default MM for MoundElement
    for (uint32_t i = 1; i < MAX_LEVELS; i++) {
      levels_[i] = nullptr;
    }
  }

  ~RelaxedConcurrentPriorityQueue() {
    if (PopBatch > 0) {
      deleteSharedBuffer();
    }
    if (MayBlock) {
      futex_array_.reset();
    }
    Position pos;
    pos.level = pos.index = 0;
    deleteAllNodes(pos);
    // default MM for MoundElement
    for (int i = getBottomLevel(); i >= 0; i--) {
      delete[] levels_[i];
    }
  }

  void push(const T& val) {
    moundPush(val);
    if (SupportsSize) {
      counter_p_.fetch_add(1, std::memory_order_relaxed);
    }
  }

  void pop(T& val) {
    moundPop(val);
    if (SupportsSize) {
      counter_c_.fetch_add(1, std::memory_order_relaxed);
    }
  }

  /// Note: size() and empty() are guaranteed to be accurate only if
  ///       the queue is not changed concurrently.
  /// Returns an estimate of the size of the queue
  size_t size() {
    DCHECK(SupportsSize);
    size_t p = counter_p_.load(std::memory_order_acquire);
    size_t c = counter_c_.load(std::memory_order_acquire);
    return (p > c) ? p - c : 0;
  }

  /// Returns true only if the queue was empty during the call.
  bool empty() {
    return isEmpty();
  }

 private:
  uint32_t getBottomLevel() {
    return bottom_.load(std::memory_order_acquire);
  }

  /// This function is only called by the destructor
  void deleteSharedBuffer() {
    DCHECK(PopBatch > 0);
    // delete nodes in the buffer
    int loc = top_loc_.load(std::memory_order_relaxed);
    while (loc >= 0) {
      Node* n = shared_buffer_[loc--].pnode.load(std::memory_order_relaxed);
      delete n;
    }
    // delete buffer
    shared_buffer_.reset();
  }

  /// This function is only called by the destructor
  void deleteAllNodes(const Position& pos) {
    if (getElementSize(pos) == 0) {
      // current list is empty, do not need to check
      // its children again.
      return;
    }

    Node* curList = getList(pos);
    setTreeNode(pos, nullptr);
    while (curList != nullptr) { // reclaim nodes
      Node* n = curList;
      curList = curList->next;
      delete n;
    }

    if (!isLeaf(pos)) {
      deleteAllNodes(leftOf(pos));
      deleteAllNodes(rightOf(pos));
    }
  }

  /// Check the first node in TreeElement keeps the heap structure.
  bool isHeap(const Position& pos) {
    if (isLeaf(pos)) {
      return true;
    }
    Position lchild = leftOf(pos);
    Position rchild = rightOf(pos);
    return isHeap(lchild) && isHeap(rchild) &&
        readValue(pos) >= readValue(lchild) &&
        readValue(pos) >= readValue(rchild);
  }

  /// Current position is leaf?
  FOLLY_ALWAYS_INLINE bool isLeaf(const Position& pos) {
    return pos.level == getBottomLevel();
  }

  /// Current element is the root?
  FOLLY_ALWAYS_INLINE bool isRoot(const Position& pos) {
    return pos.level == 0;
  }

  /// Locate the parent node
  FOLLY_ALWAYS_INLINE Position parentOf(const Position& pos) {
    Position res;
    res.level = pos.level - 1;
    res.index = pos.index / 2;
    return res;
  }

  /// Locate the left child
  FOLLY_ALWAYS_INLINE Position leftOf(const Position& pos) {
    Position res;
    res.level = pos.level + 1;
    res.index = pos.index * 2;
    return res;
  }

  /// Locate the right child
  FOLLY_ALWAYS_INLINE Position rightOf(const Position& pos) {
    Position res;
    res.level = pos.level + 1;
    res.index = pos.index * 2 + 1;
    return res;
  }

  /// get the list size in current MoundElement
  FOLLY_ALWAYS_INLINE size_t getElementSize(const Position& pos) {
    return levels_[pos.level][pos.index].size.load(std::memory_order_relaxed);
  }

  /// Set the size of current MoundElement
  FOLLY_ALWAYS_INLINE void setElementSize(
      const Position& pos,
      const uint32_t& v) {
    levels_[pos.level][pos.index].size.store(v, std::memory_order_relaxed);
  }

  /// Extend the tree level
  void grow(uint32_t btm) {
    while (true) {
      if (guard_.fetch_add(1, std::memory_order_acq_rel) == 0) {
        break;
      }
      // someone already expanded the tree
      if (btm != getBottomLevel()) {
        return;
      }
      std::this_thread::yield();
    }
    // double check the bottom has not changed yet
    if (btm != getBottomLevel()) {
      guard_.store(0, std::memory_order_release);
      return;
    }
    // create and initialize the new level
    uint32_t tmp_btm = getBottomLevel();
    uint32_t size = 1 << (tmp_btm + 1);
    MoundElement* new_level = new MoundElement[size]; // MM
    levels_[tmp_btm + 1] = new_level;
    bottom_.store(tmp_btm + 1, std::memory_order_acq_rel);
    guard_.store(0, std::memory_order_release);
  }

  /// TODO: optimization
  // This function is important, it selects a position to insert the
  // node, there are two execution paths when this function returns.
  // 1. It returns a position with head node has lower priority than the target.
  // Thus it could be potentially used as the starting element to do the binary
  // search to find the fit position.  (slow path)
  // 2. It returns a position, which is not the best fit.
  // But it prevents aggressively grow the Mound. (fast path)
  Position selectPosition(
      const T& val,
      bool& path,
      uint32_t& seed,
      folly::hazptr_holder<Atom>& hptr) {
    while (true) {
      uint32_t b = getBottomLevel();
      int bound = 1 << b; // number of elements in this level
      int steps = 1 + b * b; // probe the length
      ++seed;
      uint32_t index = seed % bound;

      for (int i = 0; i < steps; i++) {
        int loc = (index + i) % bound;
        Position pos;
        pos.level = b;
        pos.index = loc;
        // the first round, we do the quick check
        if (optimisticReadValue(pos, hptr) <= val) {
          path = false;
          seed = ++loc;
          return pos;
        } else if (
            b > LevelForForceInsert && getElementSize(pos) < ListTargetSize) {
          // [fast path] conservative implementation
          // it makes sure every tree element should
          // have more than the given number of nodes.
          seed = ++loc;
          path = true;
          return pos;
        }
        if (b != getBottomLevel()) {
          break;
        }
      }
      // failed too many times grow
      if (b == getBottomLevel()) {
        grow(b);
      }
    }
  }

  /// Swap two Tree Elements (head, size)
  void swapList(const Position& a, const Position& b) {
    Node* tmp = getList(a);
    setTreeNode(a, getList(b));
    setTreeNode(b, tmp);

    // need to swap the tree node meta-data
    uint32_t sa = getElementSize(a);
    uint32_t sb = getElementSize(b);
    setElementSize(a, sb);
    setElementSize(b, sa);
  }

  FOLLY_ALWAYS_INLINE void lockNode(const Position& pos) {
    levels_[pos.level][pos.index].lock.lock();
  }

  FOLLY_ALWAYS_INLINE void unlockNode(const Position& pos) {
    levels_[pos.level][pos.index].lock.unlock();
  }

  FOLLY_ALWAYS_INLINE bool trylockNode(const Position& pos) {
    return levels_[pos.level][pos.index].lock.try_lock();
  }

  FOLLY_ALWAYS_INLINE T
  optimisticReadValue(const Position& pos, folly::hazptr_holder<Atom>& hptr) {
    Node* tmp = hptr.get_protected(levels_[pos.level][pos.index].head);
    return (tmp == nullptr) ? MIN_VALUE : tmp->val;
  }

  // Get the value from the head of the list as the elementvalue
  FOLLY_ALWAYS_INLINE T readValue(const Position& pos) {
    Node* tmp = getList(pos);
    return (tmp == nullptr) ? MIN_VALUE : tmp->val;
  }

  FOLLY_ALWAYS_INLINE Node* getList(const Position& pos) {
    return levels_[pos.level][pos.index].head.load(std::memory_order_relaxed);
  }

  FOLLY_ALWAYS_INLINE void setTreeNode(const Position& pos, Node* t) {
    levels_[pos.level][pos.index].head.store(t, std::memory_order_relaxed);
  }

  // Merge two sorted lists
  Node* mergeList(Node* base, Node* source) {
    if (base == nullptr) {
      return source;
    } else if (source == nullptr) {
      return base;
    }

    Node *res, *p;
    // choose the head node
    if (base->val >= source->val) {
      res = base;
      base = base->next;
      p = res;
    } else {
      res = source;
      source = source->next;
      p = res;
    }

    while (base != nullptr && source != nullptr) {
      if (base->val >= source->val) {
        p->next = base;
        base = base->next;
      } else {
        p->next = source;
        source = source->next;
      }
      p = p->next;
    }
    if (base == nullptr) {
      p->next = source;
    } else {
      p->next = base;
    }
    return res;
  }

  /// Merge list t to the Element Position
  void mergeListTo(const Position& pos, Node* t, const size_t& list_length) {
    Node* head = getList(pos);
    setTreeNode(pos, mergeList(head, t));
    uint32_t ns = getElementSize(pos) + list_length;
    setElementSize(pos, ns);
  }

  bool pruningLeaf(const Position& pos) {
    if (getElementSize(pos) <= PruningSize) {
      unlockNode(pos);
      return true;
    }

    int b = getBottomLevel();
    int leaves = 1 << b;
    int cnodes = 0;
    for (int i = 0; i < leaves; i++) {
      Position tmp;
      tmp.level = b;
      tmp.index = i;
      if (getElementSize(tmp) != 0) {
        cnodes++;
      }
      if (cnodes > leaves * 2 / 3) {
        break;
      }
    }

    if (cnodes <= leaves * 2 / 3) {
      unlockNode(pos);
      return true;
    }
    return false;
  }

  /// Split the current list into two lists,
  /// then split the tail list and merge to two children.
  void startPruning(const Position& pos) {
    if (isLeaf(pos) && pruningLeaf(pos)) {
      return;
    }

    // split the list, record the tail
    Node* pruning_head = getList(pos);
    int steps = ListTargetSize; // keep in the original list
    for (int i = 0; i < steps - 1; i++) {
      pruning_head = pruning_head->next;
    }
    Node* t = pruning_head;
    pruning_head = pruning_head->next;
    t->next = nullptr;
    int tail_length = getElementSize(pos) - steps;
    setElementSize(pos, steps);

    // split the tail list into two lists
    // evenly merge to two children
    if (pos.level != getBottomLevel()) {
      // split the rest into two lists
      int left_length = (tail_length + 1) / 2;
      int right_length = tail_length - left_length;
      Node *to_right, *to_left = pruning_head;
      for (int i = 0; i < left_length - 1; i++) {
        pruning_head = pruning_head->next;
      }
      to_right = pruning_head->next;
      pruning_head->next = nullptr;

      Position lchild = leftOf(pos);
      Position rchild = rightOf(pos);
      if (left_length != 0) {
        lockNode(lchild);
        mergeListTo(lchild, to_left, left_length);
      }
      if (right_length != 0) {
        lockNode(rchild);
        mergeListTo(rchild, to_right, right_length);
      }
      unlockNode(pos);
      if (left_length != 0 && getElementSize(lchild) > PruningSize) {
        startPruning(lchild);
      } else if (left_length != 0) {
        unlockNode(lchild);
      }
      if (right_length != 0 && getElementSize(rchild) > PruningSize) {
        startPruning(rchild);
      } else if (right_length != 0) {
        unlockNode(rchild);
      }
    } else { // time to grow the Mound
      grow(pos.level);
      // randomly choose a child to insert
      if (steps % 2 == 1) {
        Position rchild = rightOf(pos);
        lockNode(rchild);
        mergeListTo(rchild, pruning_head, tail_length);
        unlockNode(pos);
        unlockNode(rchild);
      } else {
        Position lchild = leftOf(pos);
        lockNode(lchild);
        mergeListTo(lchild, pruning_head, tail_length);
        unlockNode(pos);
        unlockNode(lchild);
      }
    }
  }

  // This function insert the new node (always) at the head of the
  // current list. It needs to lock the parent & current
  // This function may cause the list becoming tooooo long, so we
  // provide pruning algorithm.
  bool regularInsert(const Position& pos, const T& val, Node* newNode) {
    // insert to the root node
    if (isRoot(pos)) {
      lockNode(pos);
      T nv = readValue(pos);
      if (LIKELY(nv <= val)) {
        newNode->next = getList(pos);
        setTreeNode(pos, newNode);
        uint32_t sz = getElementSize(pos);
        setElementSize(pos, sz + 1);
        if (UNLIKELY(sz > PruningSize)) {
          startPruning(pos);
        } else {
          unlockNode(pos);
        }
        return true;
      }
      unlockNode(pos);
      return false;
    }

    // insert to an inner node
    Position parent = parentOf(pos);
    if (!trylockNode(parent)) {
      return false;
    }
    if (!trylockNode(pos)) {
      unlockNode(parent);
      return false;
    }
    T pv = readValue(parent);
    T nv = readValue(pos);
    if (LIKELY(pv > val && nv <= val)) {
      // improve the accuracy by getting the node(R) with less priority than the
      // new value from parent level, insert the new node to the parent list
      // and insert R to the current list.
      // It only happens at >= LevelForTraverseParent for reducing contention
      uint32_t sz = getElementSize(pos);
      if (pos.level >= LevelForTraverseParent) {
        Node* start = getList(parent);
        while (start->next != nullptr && start->next->val >= val) {
          start = start->next;
        }
        if (start->next != nullptr) {
          newNode->next = start->next;
          start->next = newNode;
          while (start->next->next != nullptr) {
            start = start->next;
          }
          newNode = start->next;
          start->next = nullptr;
        }
        unlockNode(parent);

        Node* curList = getList(pos);
        if (curList == nullptr) {
          newNode->next = nullptr;
          setTreeNode(pos, newNode);
        } else {
          Node* p = curList;
          if (p->val <= newNode->val) {
            newNode->next = curList;
            setTreeNode(pos, newNode);
          } else {
            while (p->next != nullptr && p->next->val >= newNode->val) {
              p = p->next;
            }
            newNode->next = p->next;
            p->next = newNode;
          }
        }
        setElementSize(pos, sz + 1);
      } else {
        unlockNode(parent);
        newNode->next = getList(pos);
        setTreeNode(pos, newNode);
        setElementSize(pos, sz + 1);
      }
      if (UNLIKELY(sz > PruningSize)) {
        startPruning(pos);
      } else {
        unlockNode(pos);
      }
      return true;
    }
    unlockNode(parent);
    unlockNode(pos);
    return false;
  }

  bool forceInsertToRoot(Node* newNode) {
    Position pos;
    pos.level = pos.index = 0;
    std::unique_lock<Mutex> lck(
        levels_[pos.level][pos.index].lock, std::try_to_lock);
    if (!lck.owns_lock()) {
      return false;
    }
    uint32_t sz = getElementSize(pos);
    if (sz >= ListTargetSize) {
      return false;
    }

    Node* curList = getList(pos);
    if (curList == nullptr) {
      newNode->next = nullptr;
      setTreeNode(pos, newNode);
    } else {
      Node* p = curList;
      if (p->val <= newNode->val) {
        newNode->next = curList;
        setTreeNode(pos, newNode);
      } else {
        while (p->next != nullptr && p->next->val >= newNode->val) {
          p = p->next;
        }
        newNode->next = p->next;
        p->next = newNode;
      }
    }
    setElementSize(pos, sz + 1);
    return true;
  }

  // This function forces the new node inserting to the current position
  // if the element does not hold the enough nodes. It is safe to
  // lock just one position to insert, because it won't be the first
  // node to sustain the heap structure.
  bool forceInsert(const Position& pos, const T& val, Node* newNode) {
    if (isRoot(pos)) {
      return forceInsertToRoot(newNode);
    }

    while (true) {
      std::unique_lock<Mutex> lck(
          levels_[pos.level][pos.index].lock, std::try_to_lock);
      if (!lck.owns_lock()) {
        if (getElementSize(pos) < ListTargetSize && readValue(pos) >= val) {
          continue;
        } else {
          return false;
        }
      }
      T nv = readValue(pos);
      uint32_t sz = getElementSize(pos);
      // do not allow the new node to be the first one
      // do not allow the list size tooooo big
      if (UNLIKELY(nv < val || sz >= ListTargetSize)) {
        return false;
      }

      Node* p = getList(pos);
      // find a place to insert the node
      while (p->next != nullptr && p->next->val > val) {
        p = p->next;
      }
      newNode->next = p->next;
      p->next = newNode;
      // do not forget to change the metadata
      setElementSize(pos, sz + 1);
      return true;
    }
  }

  void binarySearchPosition(
      Position& cur,
      const T& val,
      folly::hazptr_holder<Atom>& hptr) {
    Position parent, mid;
    if (cur.level == 0) {
      return;
    }
    // start from the root
    parent.level = parent.index = 0;

    while (true) { // binary search
      mid.level = (cur.level + parent.level) / 2;
      mid.index = cur.index >> (cur.level - mid.level);

      T mv = optimisticReadValue(mid, hptr);
      if (val < mv) {
        parent = mid;
      } else {
        cur = mid;
      }

      if (mid.level == 0 || // the root
          ((parent.level + 1 == cur.level) && parent.level != 0)) {
        return;
      }
    }
  }

  // The push keeps the length of each element stable
  void moundPush(const T& val) {
    Position cur;
    folly::hazptr_holder<Atom> hptr;
    Node* newNode = new Node;
    newNode->val = val;
    uint32_t seed = folly::Random::rand32() % (1 << 21);

    while (true) {
      // shell we go the fast path?
      bool go_fast_path = false;
      // chooice the right node to start
      cur = selectPosition(val, go_fast_path, seed, hptr);
      if (go_fast_path) {
        if (LIKELY(forceInsert(cur, val, newNode))) {
          if (MayBlock) {
            blockingPushImpl();
          }
          return;
        } else {
          continue;
        }
      }

      binarySearchPosition(cur, val, hptr);
      if (LIKELY(regularInsert(cur, val, newNode))) {
        if (MayBlock) {
          blockingPushImpl();
        }
        return;
      }
    }
  }

  int popToSharedBuffer(const uint32_t rsize, Node* head) {
    Position pos;
    pos.level = pos.index = 0;

    int num = std::min(rsize, (uint32_t)PopBatch);
    for (int i = num - 1; i >= 0; i--) {
      // wait until this block is empty
      while (shared_buffer_[i].pnode.load(std::memory_order_relaxed) != nullptr)
        ;
      shared_buffer_[i].pnode.store(head, std::memory_order_relaxed);
      head = head->next;
    }
    if (num > 0) {
      top_loc_.store(num - 1, std::memory_order_acq_rel);
    }
    setTreeNode(pos, head);
    return rsize - num;
  }

  void mergeDown(const Position& pos) {
    if (isLeaf(pos)) {
      unlockNode(pos);
      return;
    }

    // acquire locks for L and R and compare
    Position lchild = leftOf(pos);
    Position rchild = rightOf(pos);
    lockNode(lchild);
    lockNode(rchild);
    // read values
    T nv = readValue(pos);
    T lv = readValue(lchild);
    T rv = readValue(rchild);
    if (nv >= lv && nv >= rv) {
      unlockNode(pos);
      unlockNode(lchild);
      unlockNode(rchild);
      return;
    }

    // If two children contains nodes less than the
    // threshold, we merge two children to the parent
    // and do merge down on both of them.
    size_t sum =
        getElementSize(rchild) + getElementSize(lchild) + getElementSize(pos);
    if (sum <= MergingSize) {
      Node* l1 = mergeList(getList(rchild), getList(lchild));
      setTreeNode(pos, mergeList(l1, getList(pos)));
      setElementSize(pos, sum);
      setTreeNode(lchild, nullptr);
      setElementSize(lchild, 0);
      setTreeNode(rchild, nullptr);
      setElementSize(rchild, 0);
      unlockNode(pos);
      mergeDown(lchild);
      mergeDown(rchild);
      return;
    }
    // pull from right
    if (rv >= lv && rv > nv) {
      swapList(rchild, pos);
      unlockNode(pos);
      unlockNode(lchild);
      mergeDown(rchild);
    } else if (lv >= rv && lv > nv) {
      // pull from left
      swapList(lchild, pos);
      unlockNode(pos);
      unlockNode(rchild);
      mergeDown(lchild);
    }
  }

  bool deferSettingRootSize(Position& pos) {
    if (isLeaf(pos)) {
      setElementSize(pos, 0);
      unlockNode(pos);
      return true;
    }

    // acquire locks for L and R and compare
    Position lchild = leftOf(pos);
    Position rchild = rightOf(pos);
    lockNode(lchild);
    lockNode(rchild);
    if (getElementSize(lchild) == 0 && getElementSize(rchild) == 0) {
      setElementSize(pos, 0);
      unlockNode(pos);
      unlockNode(lchild);
      unlockNode(rchild);
      return true;
    } else {
      // read values
      T lv = readValue(lchild);
      T rv = readValue(rchild);
      if (lv >= rv) {
        swapList(lchild, pos);
        setElementSize(lchild, 0);
        unlockNode(pos);
        unlockNode(rchild);
        pos = lchild;
      } else {
        swapList(rchild, pos);
        setElementSize(rchild, 0);
        unlockNode(pos);
        unlockNode(lchild);
        pos = rchild;
      }
      return false;
    }
  }

  bool moundPopMany(T& val) {
    // pop from the root
    Position pos;
    pos.level = pos.index = 0;
    // the root is nullptr, return false
    Node* head = getList(pos);
    if (head == nullptr) {
      unlockNode(pos);
      return false;
    }

    // shared buffer already filled by other threads
    if (PopBatch > 0 && top_loc_.load(std::memory_order_acquire) >= 0) {
      unlockNode(pos);
      return false;
    }

    uint32_t sz = getElementSize(pos);
    // get the one node first
    val = head->val;
    Node* p = head;
    head = head->next;
    sz--;

    if (PopBatch > 0) {
      sz = popToSharedBuffer(sz, head);
    } else {
      setTreeNode(pos, head);
    }

    bool done = false;
    if (LIKELY(sz == 0)) {
      done = deferSettingRootSize(pos);
    } else {
      setElementSize(pos, sz);
    }

    if (LIKELY(!done)) {
      mergeDown(pos);
    }

    p->retire();
    return true;
  }

  void blockingPushImpl() {
    auto p = pticket_.fetch_add(1, std::memory_order_acq_rel);
    auto loc = getFutexArrayLoc(p);
    uint32_t curfutex = futex_array_[loc].load(std::memory_order_acquire);

    while (true) {
      uint32_t ready = p << 1; // get the lower 31 bits
      // avoid the situation that push has larger ticket already set the value
      if (UNLIKELY(
              ready + 1 < curfutex ||
              ((curfutex > ready) && (curfutex - ready > 0x40000000)))) {
        return;
      }

      if (futex_array_[loc].compare_exchange_strong(curfutex, ready)) {
        if (curfutex &
            1) { // One or more consumers may be blocked on this futex
          detail::futexWake(&futex_array_[loc]);
        }
        return;
      } else {
        curfutex = futex_array_[loc].load(std::memory_order_acquire);
      }
    }
  }

  // This could guarentee the Mound is empty
  FOLLY_ALWAYS_INLINE bool isMoundEmpty() {
    Position pos;
    pos.level = pos.index = 0;
    return getElementSize(pos) == 0;
  }

  // Return true if the shared buffer is empty
  FOLLY_ALWAYS_INLINE bool isSharedBufferEmpty() {
    return top_loc_.load(std::memory_order_acquire) < 0;
  }

  FOLLY_ALWAYS_INLINE bool isEmpty() {
    if (PopBatch > 0) {
      return isMoundEmpty() && isSharedBufferEmpty();
    }
    return isMoundEmpty();
  }

  FOLLY_ALWAYS_INLINE bool futexIsReady(const size_t& curticket) {
    auto loc = getFutexArrayLoc(curticket);
    auto curfutex = futex_array_[loc].load(std::memory_order_acquire);
    uint32_t short_cticket = curticket & 0x7FFFFFFF;
    uint32_t futex_ready = curfutex >> 1;
    // handle unsigned 31 bits overflow
    return futex_ready >= short_cticket ||
        short_cticket - futex_ready > 0x40000000;
  }

  template <typename Clock, typename Duration>
  FOLLY_NOINLINE bool trySpinBeforeBlock(
      const size_t& curticket,
      const std::chrono::time_point<Clock, Duration>& deadline,
      const folly::WaitOptions& opt = wait_options()) {
    return folly::detail::spin_pause_until(deadline, opt, [=] {
             return futexIsReady(curticket);
           }) == folly::detail::spin_result::success;
  }

  void tryBlockingPop(const size_t& curticket) {
    auto loc = getFutexArrayLoc(curticket);
    auto curfutex = futex_array_[loc].load(std::memory_order_acquire);
    if (curfutex &
        1) { /// The last round consumers are still waiting, go to sleep
      detail::futexWait(&futex_array_[loc], curfutex);
    }
    if (trySpinBeforeBlock(
            curticket,
            std::chrono::time_point<std::chrono::steady_clock>::max())) {
      return; /// Spin until the push ticket is ready
    }
    while (true) {
      curfutex = futex_array_[loc].load(std::memory_order_acquire);
      if (curfutex &
          1) { /// The last round consumers are still waiting, go to sleep
        detail::futexWait(&futex_array_[loc], curfutex);
      } else if (!futexIsReady(curticket)) { // current ticket < pop ticket
        uint32_t blocking_futex = curfutex + 1;
        if (futex_array_[loc].compare_exchange_strong(
                curfutex, blocking_futex)) {
          detail::futexWait(&futex_array_[loc], blocking_futex);
        }
      } else {
        return;
      }
    }
  }

  void blockingPopImpl() {
    auto ct = cticket_.fetch_add(1, std::memory_order_acq_rel);
    // fast path check
    if (futexIsReady(ct)) {
      return;
    }
    // Blocking
    tryBlockingPop(ct);
  }

  bool tryPopFromMound(T& val) {
    if (isMoundEmpty()) {
      return false;
    }
    Position pos;
    pos.level = pos.index = 0;

    // lock the root
    if (trylockNode(pos)) {
      return moundPopMany(val);
    }
    return false;
  }

  FOLLY_ALWAYS_INLINE static folly::WaitOptions wait_options() {
    return {};
  }

  template <typename Clock, typename Duration>
  FOLLY_NOINLINE bool tryWait(
      const std::chrono::time_point<Clock, Duration>& deadline,
      const folly::WaitOptions& opt = wait_options()) {
    // Fast path, by quick check the status
    switch (folly::detail::spin_pause_until(
        deadline, opt, [=] { return !isEmpty(); })) {
      case folly::detail::spin_result::success:
        return true;
      case folly::detail::spin_result::timeout:
        return false;
      case folly::detail::spin_result::advance:
        break;
    }

    // Spinning strategy
    while (true) {
      auto res =
          folly::detail::spin_yield_until(deadline, [=] { return !isEmpty(); });
      if (res == folly::detail::spin_result::success) {
        return true;
      } else if (res == folly::detail::spin_result::timeout) {
        return false;
      }
    }
    return true;
  }

  bool tryPopFromSharedBuffer(T& val) {
    int get_or = -1;
    if (!isSharedBufferEmpty()) {
      get_or = top_loc_.fetch_sub(1, std::memory_order_acq_rel);
      if (get_or >= 0) {
        Node* c = shared_buffer_[get_or].pnode.load(std::memory_order_relaxed);
        shared_buffer_[get_or].pnode.store(nullptr, std::memory_order_release);
        val = c->val;
        c->retire();
        return true;
      }
    }
    return false;
  }

  size_t getFutexArrayLoc(size_t s) {
    return ((s - 1) * Stride) & (NumFutex - 1);
  }

  void moundPop(T& val) {
    if (MayBlock) {
      blockingPopImpl();
    }

    if (PopBatch > 0) {
      if (tryPopFromSharedBuffer(val)) {
        return;
      }
    }

    while (true) {
      if (LIKELY(tryPopFromMound(val))) {
        return;
      }
      tryWait(std::chrono::time_point<std::chrono::steady_clock>::max());
      if (PopBatch > 0 && tryPopFromSharedBuffer(val)) {
        return;
      }
    }
  }
};

} // namespace folly
