/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/synchronization/Hazptr.h>
#include <atomic>
#include <mutex>

namespace folly {

namespace detail {

namespace concurrenthashmap {

// hazptr deleter that can use an allocator.
template <typename Allocator>
class HazptrDeleter {
 public:
  template <typename Node>
  void operator()(Node* node) {
    node->~Node();
    Allocator().deallocate((uint8_t*)node, sizeof(Node));
  }
};

template <typename Allocator>
class HazptrBucketDeleter {
  size_t count_;

 public:
  HazptrBucketDeleter(size_t count) : count_(count) {}
  HazptrBucketDeleter() = default;
  template <typename Bucket>
  void operator()(Bucket* bucket) {
    bucket->destroy(count_);
  }
};

template <
    typename KeyType,
    typename ValueType,
    typename Allocator,
    typename Enabled = void>
class ValueHolder {
 public:
  typedef std::pair<const KeyType, ValueType> value_type;

  explicit ValueHolder(const ValueHolder& other) : item_(other.item_) {}

  template <typename Arg, typename... Args>
  ValueHolder(std::piecewise_construct_t, Arg&& k, Args&&... args)
      : item_(
            std::piecewise_construct,
            std::forward_as_tuple(std::forward<Arg>(k)),
            std::forward_as_tuple(std::forward<Args>(args)...)) {}
  value_type& getItem() {
    return item_;
  }

 private:
  value_type item_;
};

// If the ValueType is not copy constructible, we can instead add
// an extra indirection.  Adds more allocations / deallocations and
// pulls in an extra cacheline.
template <typename KeyType, typename ValueType, typename Allocator>
class ValueHolder<
    KeyType,
    ValueType,
    Allocator,
    std::enable_if_t<
        !std::is_nothrow_copy_constructible<ValueType>::value ||
        !std::is_nothrow_copy_constructible<KeyType>::value>> {
 public:
  typedef std::pair<const KeyType, ValueType> value_type;

  explicit ValueHolder(const ValueHolder& other) {
    other.owned_ = false;
    item_ = other.item_;
  }

  template <typename Arg, typename... Args>
  ValueHolder(std::piecewise_construct_t, Arg&& k, Args&&... args) {
    item_ = (value_type*)Allocator().allocate(sizeof(value_type));
    new (item_) value_type(
        std::piecewise_construct,
        std::forward_as_tuple(std::forward<Arg>(k)),
        std::forward_as_tuple(std::forward<Args>(args)...));
  }

  ~ValueHolder() {
    if (owned_) {
      item_->~value_type();
      Allocator().deallocate((uint8_t*)item_, sizeof(value_type));
    }
  }

  value_type& getItem() {
    return *item_;
  }

 private:
  value_type* item_;
  mutable bool owned_{true};
};

template <
    typename KeyType,
    typename ValueType,
    typename Allocator,
    template <typename> class Atom = std::atomic>
class NodeT : public hazptr_obj_base_linked<
                  NodeT<KeyType, ValueType, Allocator, Atom>,
                  Atom,
                  concurrenthashmap::HazptrDeleter<Allocator>> {
 public:
  typedef std::pair<const KeyType, ValueType> value_type;

  explicit NodeT(NodeT* other) : item_(other->item_) {
    this->set_deleter( // defined in hazptr_obj
        concurrenthashmap::HazptrDeleter<Allocator>());
    this->acquire_link_safe(); // defined in hazptr_obj_base_linked
  }

  template <typename Arg, typename... Args>
  NodeT(Arg&& k, Args&&... args)
      : item_(
            std::piecewise_construct,
            std::forward<Arg>(k),
            std::forward<Args>(args)...) {
    this->set_deleter( // defined in hazptr_obj
        concurrenthashmap::HazptrDeleter<Allocator>());
    this->acquire_link_safe(); // defined in hazptr_obj_base_linked
  }

  void release() {
    this->unlink();
  }

  value_type& getItem() {
    return item_.getItem();
  }

  template <typename S>
  void push_links(bool m, S& s) {
    if (m) {
      auto p = next_.load(std::memory_order_acquire);
      if (p) {
        s.push(p);
      }
    }
  }

  Atom<NodeT*> next_{nullptr};

 private:
  ValueHolder<KeyType, ValueType, Allocator> item_;
};

} // namespace concurrenthashmap

/* A Segment is a single shard of the ConcurrentHashMap.
 * All writes take the lock, while readers are all wait-free.
 * Readers always proceed in parallel with the single writer.
 *
 *
 * Possible additional optimizations:
 *
 * * insert / erase could be lock / wait free.  Would need to be
 *   careful that assign and rehash don't conflict (possibly with
 *   reader/writer lock, or microlock per node or per bucket, etc).
 *   Java 8 goes halfway, and does lock per bucket, except for the
 *   first item, that is inserted with a CAS (which is somewhat
 *   specific to java having a lock per object)
 *
 * * I tried using trylock() and find() to warm the cache for insert()
 *   and erase() similar to Java 7, but didn't have much luck.
 *
 * * We could order elements using split ordering, for faster rehash,
 *   and no need to ever copy nodes.  Note that a full split ordering
 *   including dummy nodes increases the memory usage by 2x, but we
 *   could split the difference and still require a lock to set bucket
 *   pointers.
 */
template <
    typename KeyType,
    typename ValueType,
    uint8_t ShardBits = 0,
    typename HashFn = std::hash<KeyType>,
    typename KeyEqual = std::equal_to<KeyType>,
    typename Allocator = std::allocator<uint8_t>,
    template <typename> class Atom = std::atomic,
    class Mutex = std::mutex>
class alignas(64) ConcurrentHashMapSegment {
  enum class InsertType {
    DOES_NOT_EXIST, // insert/emplace operations.  If key exists, return false.
    MUST_EXIST, // assign operations.  If key does not exist, return false.
    ANY, // insert_or_assign.
    MATCH, // assign_if_equal (not in std).  For concurrent maps, a
           // way to atomically change a value if equal to some other
           // value.
  };

 public:
  typedef KeyType key_type;
  typedef ValueType mapped_type;
  typedef std::pair<const KeyType, ValueType> value_type;
  typedef std::size_t size_type;

  using Node = concurrenthashmap::NodeT<KeyType, ValueType, Allocator, Atom>;
  class Iterator;

  ConcurrentHashMapSegment(
      size_t initial_buckets,
      float load_factor,
      size_t max_size)
      : load_factor_(load_factor), max_size_(max_size) {
    initial_buckets = folly::nextPowTwo(initial_buckets);
    DCHECK(
        max_size_ == 0 ||
        (isPowTwo(max_size_) &&
         (folly::popcount(max_size_ - 1) + ShardBits <= 32)));
    auto buckets = Buckets::create(initial_buckets);
    buckets_.store(buckets, std::memory_order_release);
    load_factor_nodes_ = initial_buckets * load_factor_;
    bucket_count_.store(initial_buckets, std::memory_order_relaxed);
  }

  ~ConcurrentHashMapSegment() {
    auto buckets = buckets_.load(std::memory_order_relaxed);
    // We can delete and not retire() here, since users must have
    // their own synchronization around destruction.
    auto count = bucket_count_.load(std::memory_order_relaxed);
    buckets->unlink_and_reclaim_nodes(count);
    buckets->destroy(count);
  }

  size_t size() {
    return size_;
  }

  bool empty() {
    return size() == 0;
  }

  bool insert(Iterator& it, std::pair<key_type, mapped_type>&& foo) {
    return insert(it, std::move(foo.first), std::move(foo.second));
  }

  template <typename Key, typename Value>
  bool insert(Iterator& it, Key&& k, Value&& v) {
    auto node = (Node*)Allocator().allocate(sizeof(Node));
    new (node) Node(std::forward<Key>(k), std::forward<Value>(v));
    auto res = insert_internal(
        it,
        node->getItem().first,
        InsertType::DOES_NOT_EXIST,
        [](const ValueType&) { return false; },
        node,
        node);
    if (!res) {
      node->~Node();
      Allocator().deallocate((uint8_t*)node, sizeof(Node));
    }
    return res;
  }

  template <typename Key, typename... Args>
  bool try_emplace(Iterator& it, Key&& k, Args&&... args) {
    // Note: first key is only ever compared.  Second is moved in to
    // create the node, and the first key is never touched again.
    return insert_internal(
        it,
        std::forward<Key>(k),
        InsertType::DOES_NOT_EXIST,
        [](const ValueType&) { return false; },
        nullptr,
        std::forward<Key>(k),
        std::forward<Args>(args)...);
  }

  template <typename... Args>
  bool emplace(Iterator& it, const KeyType& k, Node* node) {
    return insert_internal(
        it,
        k,
        InsertType::DOES_NOT_EXIST,
        [](const ValueType&) { return false; },
        node,
        node);
  }

  template <typename Key, typename Value>
  bool insert_or_assign(Iterator& it, Key&& k, Value&& v) {
    auto node = (Node*)Allocator().allocate(sizeof(Node));
    new (node) Node(std::forward<Key>(k), std::forward<Value>(v));
    auto res = insert_internal(
        it,
        node->getItem().first,
        InsertType::ANY,
        [](const ValueType&) { return false; },
        node,
        node);
    if (!res) {
      node->~Node();
      Allocator().deallocate((uint8_t*)node, sizeof(Node));
    }
    return res;
  }

  template <typename Key, typename Value>
  bool assign(Iterator& it, Key&& k, Value&& v) {
    auto node = (Node*)Allocator().allocate(sizeof(Node));
    new (node) Node(std::forward<Key>(k), std::forward<Value>(v));
    auto res = insert_internal(
        it,
        node->getItem().first,
        InsertType::MUST_EXIST,
        [](const ValueType&) { return false; },
        node,
        node);
    if (!res) {
      node->~Node();
      Allocator().deallocate((uint8_t*)node, sizeof(Node));
    }
    return res;
  }

  template <typename Key, typename Value>
  bool assign_if_equal(
      Iterator& it,
      Key&& k,
      const ValueType& expected,
      Value&& desired) {
    auto node = (Node*)Allocator().allocate(sizeof(Node));
    new (node) Node(std::forward<Key>(k), std::forward<Value>(desired));
    auto res = insert_internal(
        it,
        node->getItem().first,
        InsertType::MATCH,
        [&expected](const ValueType& v) { return v == expected; },
        node,
        node);
    if (!res) {
      node->~Node();
      Allocator().deallocate((uint8_t*)node, sizeof(Node));
    }
    return res;
  }

  template <typename MatchFunc, typename... Args>
  bool insert_internal(
      Iterator& it,
      const KeyType& k,
      InsertType type,
      MatchFunc match,
      Node* cur,
      Args&&... args) {
    auto h = HashFn()(k);
    std::unique_lock<Mutex> g(m_);

    size_t bcount = bucket_count_.load(std::memory_order_relaxed);
    auto buckets = buckets_.load(std::memory_order_relaxed);
    // Check for rehash needed for DOES_NOT_EXIST
    if (size_ >= load_factor_nodes_ && type == InsertType::DOES_NOT_EXIST) {
      if (max_size_ && size_ << 1 > max_size_) {
        // Would exceed max size.
        throw std::bad_alloc();
      }
      rehash(bcount << 1);
      buckets = buckets_.load(std::memory_order_relaxed);
      bcount = bucket_count_.load(std::memory_order_relaxed);
    }

    auto idx = getIdx(bcount, h);
    auto head = &buckets->buckets_[idx]();
    auto node = head->load(std::memory_order_relaxed);
    auto headnode = node;
    auto prev = head;
    auto& hazbuckets = it.hazptrs_[0];
    auto& haznode = it.hazptrs_[1];
    hazbuckets.reset(buckets);
    while (node) {
      // Is the key found?
      if (KeyEqual()(k, node->getItem().first)) {
        it.setNode(node, buckets, bcount, idx);
        haznode.reset(node);
        if (type == InsertType::MATCH) {
          if (!match(node->getItem().second)) {
            return false;
          }
        }
        if (type == InsertType::DOES_NOT_EXIST) {
          return false;
        } else {
          if (!cur) {
            cur = (Node*)Allocator().allocate(sizeof(Node));
            new (cur) Node(std::forward<Args>(args)...);
          }
          auto next = node->next_.load(std::memory_order_relaxed);
          cur->next_.store(next, std::memory_order_relaxed);
          if (next) {
            next->acquire_link(); // defined in hazptr_obj_base_linked
          }
          prev->store(cur, std::memory_order_release);
          g.unlock();
          // Release not under lock.
          node->release();
          return true;
        }
      }

      prev = &node->next_;
      node = node->next_.load(std::memory_order_relaxed);
    }
    if (type != InsertType::DOES_NOT_EXIST && type != InsertType::ANY) {
      haznode.reset();
      hazbuckets.reset();
      return false;
    }
    // Node not found, check for rehash on ANY
    if (size_ >= load_factor_nodes_ && type == InsertType::ANY) {
      if (max_size_ && size_ << 1 > max_size_) {
        // Would exceed max size.
        throw std::bad_alloc();
      }
      rehash(bcount << 1);

      // Reload correct bucket.
      buckets = buckets_.load(std::memory_order_relaxed);
      bcount <<= 1;
      hazbuckets.reset(buckets);
      idx = getIdx(bcount, h);
      head = &buckets->buckets_[idx]();
      headnode = head->load(std::memory_order_relaxed);
    }

    // We found a slot to put the node.
    size_++;
    if (!cur) {
      // InsertType::ANY
      // OR DOES_NOT_EXIST, but only in the try_emplace case
      DCHECK(type == InsertType::ANY || type == InsertType::DOES_NOT_EXIST);
      cur = (Node*)Allocator().allocate(sizeof(Node));
      new (cur) Node(std::forward<Args>(args)...);
    }
    cur->next_.store(headnode, std::memory_order_relaxed);
    head->store(cur, std::memory_order_release);
    it.setNode(cur, buckets, bcount, idx);
    return true;
  }

  // Must hold lock.
  void rehash(size_t bucket_count) {
    auto buckets = buckets_.load(std::memory_order_relaxed);
    auto newbuckets = Buckets::create(bucket_count);

    load_factor_nodes_ = bucket_count * load_factor_;

    auto oldcount = bucket_count_.load(std::memory_order_relaxed);
    for (size_t i = 0; i < oldcount; i++) {
      auto bucket = &buckets->buckets_[i]();
      auto node = bucket->load(std::memory_order_relaxed);
      if (!node) {
        continue;
      }
      auto h = HashFn()(node->getItem().first);
      auto idx = getIdx(bucket_count, h);
      // Reuse as long a chain as possible from the end.  Since the
      // nodes don't have previous pointers, the longest last chain
      // will be the same for both the previous hashmap and the new one,
      // assuming all the nodes hash to the same bucket.
      auto lastrun = node;
      auto lastidx = idx;
      auto count = 0;
      auto last = node->next_.load(std::memory_order_relaxed);
      for (; last != nullptr;
           last = last->next_.load(std::memory_order_relaxed)) {
        auto k = getIdx(bucket_count, HashFn()(last->getItem().first));
        if (k != lastidx) {
          lastidx = k;
          lastrun = last;
          count = 0;
        }
        count++;
      }
      // Set longest last run in new bucket, incrementing the refcount.
      lastrun->acquire_link(); // defined in hazptr_obj_base_linked
      newbuckets->buckets_[lastidx]().store(lastrun, std::memory_order_relaxed);
      // Clone remaining nodes
      for (; node != lastrun;
           node = node->next_.load(std::memory_order_relaxed)) {
        auto newnode = (Node*)Allocator().allocate(sizeof(Node));
        new (newnode) Node(node);
        auto k = getIdx(bucket_count, HashFn()(node->getItem().first));
        auto prevhead = &newbuckets->buckets_[k]();
        newnode->next_.store(prevhead->load(std::memory_order_relaxed));
        prevhead->store(newnode, std::memory_order_relaxed);
      }
    }

    auto oldbuckets = buckets_.load(std::memory_order_relaxed);
    seqlock_.fetch_add(1, std::memory_order_release);
    bucket_count_.store(bucket_count, std::memory_order_release);
    buckets_.store(newbuckets, std::memory_order_release);
    seqlock_.fetch_add(1, std::memory_order_release);
    oldbuckets->retire(
        concurrenthashmap::HazptrBucketDeleter<Allocator>(oldcount));
  }

  bool find(Iterator& res, const KeyType& k) {
    auto& hazcurr = res.hazptrs_[1];
    auto& haznext = res.hazptrs_[2];
    auto h = HashFn()(k);
    size_t bcount;
    Buckets* buckets;
    getBucketsAndCount(bcount, buckets, res.hazptrs_[0]);

    auto idx = getIdx(bcount, h);
    auto prev = &buckets->buckets_[idx]();
    auto node = hazcurr.get_protected(*prev);
    while (node) {
      if (KeyEqual()(k, node->getItem().first)) {
        res.setNode(node, buckets, bcount, idx);
        return true;
      }
      node = haznext.get_protected(node->next_);
      hazcurr.swap(haznext);
    }
    return false;
  }

  // Listed separately because we need a prev pointer.
  size_type erase(const key_type& key) {
    return erase_internal(key, nullptr);
  }

  size_type erase_internal(const key_type& key, Iterator* iter) {
    Node* node{nullptr};
    auto h = HashFn()(key);
    {
      std::lock_guard<Mutex> g(m_);

      size_t bcount = bucket_count_.load(std::memory_order_relaxed);
      auto buckets = buckets_.load(std::memory_order_relaxed);
      auto idx = getIdx(bcount, h);
      auto head = &buckets->buckets_[idx]();
      node = head->load(std::memory_order_relaxed);
      Node* prev = nullptr;
      while (node) {
        if (KeyEqual()(key, node->getItem().first)) {
          auto next = node->next_.load(std::memory_order_relaxed);
          if (next) {
            next->acquire_link(); // defined in hazptr_obj_base_linked
          }
          if (prev) {
            prev->next_.store(next, std::memory_order_release);
          } else {
            // Must be head of list.
            head->store(next, std::memory_order_release);
          }

          if (iter) {
            iter->hazptrs_[0].reset(buckets);
            iter->setNode(
                node->next_.load(std::memory_order_acquire),
                buckets,
                bcount,
                idx);
            iter->next();
          }
          size_--;
          break;
        }
        prev = node;
        node = node->next_.load(std::memory_order_relaxed);
      }
    }
    // Delete the node while not under the lock.
    if (node) {
      node->release();
      return 1;
    }

    return 0;
  }

  // Unfortunately because we are reusing nodes on rehash, we can't
  // have prev pointers in the bucket chain.  We have to start the
  // search from the bucket.
  //
  // This is a small departure from standard stl containers: erase may
  // throw if hash or key_eq functions throw.
  void erase(Iterator& res, Iterator& pos) {
    erase_internal(pos->first, &res);
    // Invalidate the iterator.
    pos = cend();
  }

  void clear() {
    size_t bcount = bucket_count_.load(std::memory_order_relaxed);
    Buckets* buckets;
    auto newbuckets = Buckets::create(bcount);
    {
      std::lock_guard<Mutex> g(m_);
      buckets = buckets_.load(std::memory_order_relaxed);
      buckets_.store(newbuckets, std::memory_order_release);
      size_ = 0;
    }
    buckets->retire(concurrenthashmap::HazptrBucketDeleter<Allocator>(bcount));
  }

  void max_load_factor(float factor) {
    std::lock_guard<Mutex> g(m_);
    load_factor_ = factor;
    load_factor_nodes_ =
        bucket_count_.load(std::memory_order_relaxed) * load_factor_;
  }

  Iterator cbegin() {
    Iterator res;
    size_t bcount;
    Buckets* buckets;
    getBucketsAndCount(bcount, buckets, res.hazptrs_[0]);
    res.setNode(nullptr, buckets, bcount, 0);
    res.next();
    return res;
  }

  Iterator cend() {
    return Iterator(nullptr);
  }

  // Could be optimized to avoid an extra pointer dereference by
  // allocating buckets_ at the same time.
  class Buckets : public hazptr_obj_base<
                      Buckets,
                      Atom,
                      concurrenthashmap::HazptrBucketDeleter<Allocator>> {
    using BucketRoot = hazptr_root<Node, Atom>;

    Buckets() {}
    ~Buckets() {}

   public:
    static Buckets* create(size_t count) {
      auto buf =
          Allocator().allocate(sizeof(Buckets) + sizeof(BucketRoot) * count);
      auto buckets = new (buf) Buckets();
      for (size_t i = 0; i < count; i++) {
        new (&buckets->buckets_[i]) BucketRoot;
      }
      return buckets;
    }

    void destroy(size_t count) {
      for (size_t i = 0; i < count; i++) {
        buckets_[i].~BucketRoot();
      }
      this->~Buckets();
      Allocator().deallocate(
          (uint8_t*)this, sizeof(BucketRoot) * count + sizeof(*this));
    }

    void unlink_and_reclaim_nodes(size_t count) {
      for (size_t i = 0; i < count; i++) {
        auto node = buckets_[i]().load(std::memory_order_relaxed);
        if (node) {
          buckets_[i]().store(nullptr, std::memory_order_relaxed);
          while (node) {
            auto next = node->next_.load(std::memory_order_relaxed);
            if (next) {
              node->next_.store(nullptr, std::memory_order_relaxed);
            }
            node->unlink_and_reclaim_unchecked();
            node = next;
          }
        }
      }
    }

    BucketRoot buckets_[0];
  };

 public:
  class Iterator {
   public:
    FOLLY_ALWAYS_INLINE Iterator() {}
    FOLLY_ALWAYS_INLINE explicit Iterator(std::nullptr_t) : hazptrs_(nullptr) {}
    FOLLY_ALWAYS_INLINE ~Iterator() {}

    void
    setNode(Node* node, Buckets* buckets, size_t bucket_count, uint64_t idx) {
      node_ = node;
      buckets_ = buckets;
      idx_ = idx;
      bucket_count_ = bucket_count;
    }

    const value_type& operator*() const {
      DCHECK(node_);
      return node_->getItem();
    }

    const value_type* operator->() const {
      DCHECK(node_);
      return &(node_->getItem());
    }

    const Iterator& operator++() {
      DCHECK(node_);
      node_ = hazptrs_[2].get_protected(node_->next_);
      hazptrs_[1].swap(hazptrs_[2]);
      if (!node_) {
        ++idx_;
        next();
      }
      return *this;
    }

    void next() {
      while (!node_) {
        if (idx_ >= bucket_count_) {
          break;
        }
        DCHECK(buckets_);
        node_ = hazptrs_[1].get_protected(buckets_->buckets_[idx_]());
        if (node_) {
          break;
        }
        ++idx_;
      }
    }

    bool operator==(const Iterator& o) const {
      return node_ == o.node_;
    }

    bool operator!=(const Iterator& o) const {
      return !(*this == o);
    }

    Iterator& operator=(const Iterator& o) = delete;

    Iterator& operator=(Iterator&& o) noexcept {
      if (this != &o) {
        hazptrs_ = std::move(o.hazptrs_);
        node_ = std::exchange(o.node_, nullptr);
        buckets_ = std::exchange(o.buckets_, nullptr);
        bucket_count_ = std::exchange(o.bucket_count_, 0);
        idx_ = std::exchange(o.idx_, 0);
      }
      return *this;
    }

    Iterator(const Iterator& o) = delete;

    Iterator(Iterator&& o) noexcept
        : hazptrs_(std::move(o.hazptrs_)),
          node_(std::exchange(o.node_, nullptr)),
          buckets_(std::exchange(o.buckets_, nullptr)),
          bucket_count_(std::exchange(o.bucket_count_, 0)),
          idx_(std::exchange(o.idx_, 0)) {}

    // These are accessed directly from the functions above
    hazptr_array<3, Atom> hazptrs_;

   private:
    Node* node_{nullptr};
    Buckets* buckets_{nullptr};
    size_t bucket_count_{0};
    uint64_t idx_{0};
  };

 private:
  // Shards have already used low ShardBits of the hash.
  // Shift it over to use fresh bits.
  uint64_t getIdx(size_t bucket_count, size_t hash) {
    return (hash >> ShardBits) & (bucket_count - 1);
  }
  void getBucketsAndCount(
      size_t& bcount,
      Buckets*& buckets,
      hazptr_holder<Atom>& hazptr) {
    while (true) {
      auto seqlock = seqlock_.load(std::memory_order_acquire);
      bcount = bucket_count_.load(std::memory_order_acquire);
      buckets = hazptr.get_protected(buckets_);
      auto seqlock2 = seqlock_.load(std::memory_order_acquire);
      if (!(seqlock & 1) && (seqlock == seqlock2)) {
        break;
      }
    }
    DCHECK(buckets);
  }

  Mutex m_;
  float load_factor_;
  size_t load_factor_nodes_;
  size_t size_{0};
  size_t const max_size_;

  // Fields needed for read-only access, on separate cacheline.
  alignas(64) Atom<Buckets*> buckets_{nullptr};
  std::atomic<uint64_t> seqlock_{0};
  Atom<size_t> bucket_count_;
};
} // namespace detail
} // namespace folly
