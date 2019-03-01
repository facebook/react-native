/*
 * Copyright 2017 Facebook, Inc.
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
#include <exception>
#include <functional>

#include <boost/utility.hpp>
#include <boost/intrusive/list.hpp>
#include <boost/intrusive/unordered_set.hpp>
#include <boost/iterator/iterator_adaptor.hpp>
#include <folly/portability/BitsFunctexcept.h>

namespace folly {

/**
 * A general purpose LRU evicting cache. Designed to support constant time
 * set/get operations. It maintains a doubly linked list of items that are
 * threaded through an index (a hash map). The access ordered is maintained
 * on the list by moving an element to the front of list on a get. New elements
 * are added to the front of the list. The index size is set to half the
 * capacity (setting capacity to 0 is a special case. see notes at the end of
 * this section). So assuming uniform distribution of keys, set/get are both
 * constant time operations.
 *
 * On reaching capacity limit, clearSize_ LRU items are evicted at a time. If
 * a callback is specified with setPruneHook, it is invoked for each eviction.
 *
 * This is NOT a thread-safe implementation.
 *
 * Configurability: capacity of the cache, number of items to evict, eviction
 * callback and the hasher to hash the keys can all be supplied by the caller.
 *
 * If at a given state, N1 - N6 are the nodes in MRU to LRU order and hashing
 * to index keys as {(N1,N5)->H1, (N4,N5,N5)->H2, N3->Hi}, the datastructure
 * layout is as below. N1 .. N6 is a list threaded through the hash.
 * Assuming, each the number of nodes hashed to each index key is bounded, the
 * following operations run in constant time.
 * i) get computes the index key, walks the list of elements hashed to
 * the key and moves it to the front of the list, if found.
 * ii) set inserts a new node into the list and places the same node on to the
 * list of elements hashing to the corresponding index key.
 * ii) prune deletes nodes from the end of the list as well from the index.
 *
 * +----+     +----+     +----+
 * | H1 | <-> | N1 | <-> | N5 |
 * +----+     +----+     +----+
 *              ^        ^  ^
 *              |    ___/    \
 *              |   /         \
 *              |_ /________   \___
 *                /        |       \
 *               /         |        \
 *              v          v         v
 * +----+     +----+     +----+     +----+
 * | H2 | <-> | N4 | <-> | N2 | <-> | N6 |
 * +----+     +----+     +----+     +----+
 *   .          ^          ^
 *   .          |          |
 *   .          |          |
 *   .          |     _____|
 *   .          |    /
 *              v   v
 * +----+     +----+
 * | Hi | <-> | N3 |
 * +----+     +----+
 *
 * N.B 1 : Changing the capacity with setMaxSize does not change the index size
 * and it could end up in too many elements indexed to the same slot in index.
 * The set/get performance will get worse in this case. So it is best to avoid
 * resizing.
 *
 * N.B 2 : Setting capacity to 0, using setMaxSize or initialization, turns off
 * evictions based on sizeof the cache making it an INFINITE size cache
 * unless evictions of LRU items are triggered by calling prune() by clients
 * (using their own eviction criteria).
 */
template <class TKey, class TValue, class THash = std::hash<TKey>>
class EvictingCacheMap {
 private:
  // typedefs for brevity
  struct Node;
  typedef boost::intrusive::link_mode<boost::intrusive::safe_link> link_mode;
  typedef boost::intrusive::unordered_set<Node> NodeMap;
  typedef boost::intrusive::list<Node> NodeList;
  typedef std::pair<const TKey, TValue> TPair;

 public:
  typedef std::function<void(TKey, TValue&&)> PruneHookCall;

  // iterator base : returns TPair on dereference
  template <typename Value, typename TIterator>
  class iterator_base
    : public boost::iterator_adaptor<iterator_base<Value, TIterator>,
                                    TIterator,
                                    Value,
                                    boost::bidirectional_traversal_tag > {
   public:
    iterator_base() {
    }
    explicit iterator_base(TIterator it)
        : iterator_base::iterator_adaptor_(it) {
    }
    Value& dereference() const {
      return this->base_reference()->pr;
    }
  };

  // iterators
  typedef iterator_base<
    TPair, typename NodeList::iterator> iterator;
  typedef iterator_base<
    const TPair, typename NodeList::const_iterator> const_iterator;
  typedef iterator_base<
    TPair, typename NodeList::reverse_iterator> reverse_iterator;
  typedef iterator_base<
    const TPair,
    typename NodeList::const_reverse_iterator> const_reverse_iterator;

  /**
   * Construct a EvictingCacheMap
   * @param maxSize maximum size of the cache map.  Once the map size exceeds
   *     maxSize, the map will begin to evict.
   * @param clearSize the number of elements to clear at a time when the
   *     eviction size is reached.
   */
  explicit EvictingCacheMap(std::size_t maxSize, std::size_t clearSize = 1)
      : nIndexBuckets_(std::max(maxSize / 2, std::size_t(kMinNumIndexBuckets))),
        indexBuckets_(new typename NodeMap::bucket_type[nIndexBuckets_]),
        indexTraits_(indexBuckets_.get(), nIndexBuckets_),
        index_(indexTraits_),
        maxSize_(maxSize),
        clearSize_(clearSize) { }

  EvictingCacheMap(const EvictingCacheMap&) = delete;
  EvictingCacheMap& operator=(const EvictingCacheMap&) = delete;
  EvictingCacheMap(EvictingCacheMap&&) = default;
  EvictingCacheMap& operator=(EvictingCacheMap&&) = default;

  ~EvictingCacheMap() {
    setPruneHook(nullptr);
    // ignore any potential exceptions from pruneHook_
    pruneWithFailSafeOption(size(), nullptr, true);
  }

  /**
   * Adjust the max size of EvictingCacheMap. Note that this does not update
   * nIndexBuckets_ accordingly. This API can cause performance to get very
   * bad, e.g., the nIndexBuckets_ is still 100 after maxSize is updated to 1M.
   *
   * Calling this function with an arugment of 0 removes the limit on the cache
   * size and elements are not evicted unless clients explictly call prune.
   *
   * If you intend to resize dynamically using this, then picking an index size
   * that works well and initializing with corresponding maxSize is the only
   * reasonable option.
   *
   * @param maxSize new maximum size of the cache map.
   * @param pruneHook callback to use on eviction.
   */
  void setMaxSize(size_t maxSize, PruneHookCall pruneHook = nullptr) {
    if (maxSize != 0 && maxSize < size()) {
      // Prune the excess elements with our new constraints.
      prune(std::max(size() - maxSize, clearSize_), pruneHook);
    }
    maxSize_ = maxSize;
  }

  size_t getMaxSize() const {
    return maxSize_;
  }

  void setClearSize(size_t clearSize) {
    clearSize_ = clearSize;
  }

  /**
   * Check for existence of a specific key in the map.  This operation has
   *     no effect on LRU order.
   * @param key key to search for
   * @return true if exists, false otherwise
   */
  bool exists(const TKey& key) const  {
    return findInIndex(key) != index_.end();
  }

  /**
   * Get the value associated with a specific key.  This function always
   *     promotes a found value to the head of the LRU.
   * @param key key associated with the value
   * @return the value if it exists
   * @throw std::out_of_range exception of the key does not exist
   */
  TValue& get(const TKey& key) {
    auto it = find(key);
    if (it == end()) {
      std::__throw_out_of_range("Key does not exist");
    }
    return it->second;
  }

  /**
   * Get the iterator associated with a specific key.  This function always
   *     promotes a found value to the head of the LRU.
   * @param key key to associate with value
   * @return the iterator of the object (a std::pair of const TKey, TValue) or
   *     end() if it does not exist
   */
  iterator find(const TKey& key) {
    auto it = findInIndex(key);
    if (it == index_.end()) {
      return end();
    }
    lru_.erase(lru_.iterator_to(*it));
    lru_.push_front(*it);
    return iterator(lru_.iterator_to(*it));
  }

  /**
   * Get the value associated with a specific key.  This function never
   *     promotes a found value to the head of the LRU.
   * @param key key associated with the value
   * @return the value if it exists
   * @throw std::out_of_range exception of the key does not exist
   */
  const TValue& getWithoutPromotion(const TKey& key) const {
    auto it = findWithoutPromotion(key);
    if (it == end()) {
      std::__throw_out_of_range("Key does not exist");
    }
    return it->second;
  }

  TValue& getWithoutPromotion(const TKey& key) {
    auto const& cThis = *this;
    return const_cast<TValue&>(cThis.getWithoutPromotion(key));
  }

  /**
   * Get the iterator associated with a specific key.  This function never
   *     promotes a found value to the head of the LRU.
   * @param key key to associate with value
   * @return the iterator of the object (a std::pair of const TKey, TValue) or
   *     end() if it does not exist
   */
  const_iterator findWithoutPromotion(const TKey& key) const {
    auto it = findInIndex(key);
    return (it == index_.end()) ? end() : const_iterator(lru_.iterator_to(*it));
  }

  iterator findWithoutPromotion(const TKey& key) {
    auto it = findInIndex(key);
    return (it == index_.end()) ? end() : iterator(lru_.iterator_to(*it));
  }

  /**
   * Erase the key-value pair associated with key if it exists.
   * @param key key associated with the value
   * @return true if the key existed and was erased, else false
   */
  bool erase(const TKey& key) {
    auto it = findInIndex(key);
    if (it == index_.end()) {
      return false;
    }
    auto node = &(*it);
    std::unique_ptr<Node> nptr(node);
    lru_.erase(lru_.iterator_to(*node));
    index_.erase(it);
    return true;
  }

  /**
   * Set a key-value pair in the dictionary
   * @param key key to associate with value
   * @param value value to associate with the key
   * @param promote boolean flag indicating whether or not to move something
   *     to the front of an LRU.  This only really matters if you're setting
   *     a value that already exists.
   * @param pruneHook callback to use on eviction (if it occurs).
   */
  void set(const TKey& key,
           TValue value,
           bool promote = true,
           PruneHookCall pruneHook = nullptr) {
    auto it = findInIndex(key);
    if (it != index_.end()) {
      it->pr.second = std::move(value);
      if (promote) {
        lru_.erase(lru_.iterator_to(*it));
        lru_.push_front(*it);
      }
    } else {
      auto node = new Node(key, std::move(value));
      index_.insert(*node);
      lru_.push_front(*node);

      // no evictions if maxSize_ is 0 i.e. unlimited capacity
      if (maxSize_ > 0 && size() > maxSize_) {
        prune(clearSize_, pruneHook);
      }
    }
  }

  /**
   * Get the number of elements in the dictionary
   * @return the size of the dictionary
   */
  std::size_t size() const {
    return index_.size();
  }

  /**
   * Typical empty function
   * @return true if empty, false otherwise
   */
  bool empty() const {
    return index_.empty();
  }

  void clear(PruneHookCall pruneHook = nullptr) {
    prune(size(), pruneHook);
  }

  /**
   * Set the prune hook, which is the function invoked on the key and value
   *     on each eviction.  Will throw If the pruneHook throws, unless the
   *     EvictingCacheMap object is being destroyed in which case it will
   *     be ignored.
   * @param pruneHook new callback to use on eviction.
   * @param promote boolean flag indicating whether or not to move something
   *     to the front of an LRU.
   * @return the iterator of the object (a std::pair of const TKey, TValue) or
   *     end() if it does not exist
   */
  void setPruneHook(PruneHookCall pruneHook) {
    pruneHook_ = pruneHook;
  }


  /**
   * Prune the minimum of pruneSize and size() from the back of the LRU.
   * Will throw if pruneHook throws.
   * @param pruneSize minimum number of elements to prune
   * @param pruneHook a custom pruneHook function
   */
  void prune(std::size_t pruneSize, PruneHookCall pruneHook = nullptr) {
    // do not swallow exceptions for prunes not triggered from destructor
    pruneWithFailSafeOption(pruneSize, pruneHook, false);
  }

  // Iterators and such
  iterator begin() {
    return iterator(lru_.begin());
  }
  iterator end() {
    return iterator(lru_.end());
  }
  const_iterator begin() const {
    return const_iterator(lru_.begin());
  }
  const_iterator end() const {
    return const_iterator(lru_.end());
  }

  const_iterator cbegin() const {
    return const_iterator(lru_.cbegin());
  }
  const_iterator cend() const {
    return const_iterator(lru_.cend());
  }

  reverse_iterator rbegin() {
    return reverse_iterator(lru_.rbegin());
  }
  reverse_iterator rend() {
    return reverse_iterator(lru_.rend());
  }

  const_reverse_iterator rbegin() const {
    return const_reverse_iterator(lru_.rbegin());
  }
  const_reverse_iterator rend() const {
    return const_reverse_iterator(lru_.rend());
  }

  const_reverse_iterator crbegin() const {
    return const_reverse_iterator(lru_.crbegin());
  }
  const_reverse_iterator crend() const {
    return const_reverse_iterator(lru_.crend());
  }

 private:
  struct Node
    : public boost::intrusive::unordered_set_base_hook<link_mode>,
      public boost::intrusive::list_base_hook<link_mode> {
    Node(const TKey& key, TValue&& value)
        : pr(std::make_pair(key, std::move(value))) {
    }
    TPair pr;
    friend bool operator==(const Node& lhs, const Node& rhs) {
      return lhs.pr.first == rhs.pr.first;
    }
    friend std::size_t hash_value(const Node& node) {
      return THash()(node.pr.first);
    }
  };

  struct KeyHasher {
    std::size_t operator()(const Node& node) {
      return THash()(node.pr.first);
    }
    std::size_t operator()(const TKey& key) {
      return THash()(key);
    }
  };

  struct KeyValueEqual {
    bool operator()(const TKey& lhs, const Node& rhs) {
      return lhs == rhs.pr.first;
    }
    bool operator()(const Node& lhs, const TKey& rhs) {
      return lhs.pr.first == rhs;
    }
  };

  /**
   * Get the iterator in in the index associated with a specific key. This is
   * merely a search in the index and does not promote the object.
   * @param key key to associate with value
   * @return the NodeMap::iterator to the Node containing the object
   *    (a std::pair of const TKey, TValue) or index_.end() if it does not exist
   */
  typename NodeMap::iterator findInIndex(const TKey& key) {
    return index_.find(key, KeyHasher(), KeyValueEqual());
  }

  typename NodeMap::const_iterator findInIndex(const TKey& key) const {
    return index_.find(key, KeyHasher(), KeyValueEqual());
  }

  /**
   * Prune the minimum of pruneSize and size() from the back of the LRU.
   * @param pruneSize minimum number of elements to prune
   * @param pruneHook a custom pruneHook function
   * @param failSafe true if exceptions are to ignored, false by default
   */
  void pruneWithFailSafeOption(std::size_t pruneSize,
    PruneHookCall pruneHook, bool failSafe) {
    auto& ph = (nullptr == pruneHook) ? pruneHook_ : pruneHook;

    for (std::size_t i = 0; i < pruneSize && !lru_.empty(); i++) {
      auto *node = &(*lru_.rbegin());
      std::unique_ptr<Node> nptr(node);

      lru_.erase(lru_.iterator_to(*node));
      index_.erase(index_.iterator_to(*node));
      if (ph) {
        try {
          ph(node->pr.first, std::move(node->pr.second));
        } catch (...) {
          if (!failSafe) {
            throw;
          }
        }
      }
    }
  }

  static const std::size_t kMinNumIndexBuckets = 100;
  PruneHookCall pruneHook_;
  std::size_t nIndexBuckets_;
  std::unique_ptr<typename NodeMap::bucket_type[]> indexBuckets_;
  typename NodeMap::bucket_traits indexTraits_;
  NodeMap index_;
  NodeList lru_;
  std::size_t maxSize_;
  std::size_t clearSize_;
};

} // folly
