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

#pragma once

#include <algorithm>
#include <cassert>
#include <cstdint>
#include <cstring>
#include <functional>
#include <iterator>
#include <limits>
#include <type_traits>

#include <boost/iterator/iterator_adaptor.hpp>

#include <folly/Portability.h>
#include <folly/Traits.h>

/**
 * Code that aids in storing data aligned on block (possibly cache-line)
 * boundaries, perhaps with padding.
 *
 * Class Node represents one block.  Given an iterator to a container of
 * Node, class Iterator encapsulates an iterator to the underlying elements.
 * Adaptor converts a sequence of Node into a sequence of underlying elements
 * (not fully compatible with STL container requirements, see comments
 * near the Node class declaration).
 */

namespace folly {
namespace padded {

/**
 * A Node is a fixed-size container of as many objects of type T as would
 * fit in a region of memory of size NS.  The last NS % sizeof(T)
 * bytes are ignored and uninitialized.
 *
 * Node only works for trivial types, which is usually not a concern.  This
 * is intentional: Node itself is trivial, which means that it can be
 * serialized / deserialized using a simple memcpy.
 */
template <class T, size_t NS, class Enable = void>
class Node;

namespace detail {
// Shortcut to avoid writing the long enable_if expression every time
template <class T, size_t NS, class Enable = void>
struct NodeValid;
template <class T, size_t NS>
struct NodeValid<
    T,
    NS,
    typename std::enable_if<(
        std::is_trivial<T>::value && sizeof(T) <= NS &&
        NS % alignof(T) == 0)>::type> {
  typedef void type;
};
} // namespace detail

template <class T, size_t NS>
class Node<T, NS, typename detail::NodeValid<T, NS>::type> {
 public:
  typedef T value_type;
  static constexpr size_t kNodeSize = NS;
  static constexpr size_t kElementCount = NS / sizeof(T);
  static constexpr size_t kPaddingBytes = NS % sizeof(T);

  T* data() {
    return storage_.data;
  }
  const T* data() const {
    return storage_.data;
  }

  bool operator==(const Node& other) const {
    return memcmp(data(), other.data(), sizeof(T) * kElementCount) == 0;
  }
  bool operator!=(const Node& other) const {
    return !(*this == other);
  }

  /**
   * Return the number of nodes needed to represent n values.  Rounds up.
   */
  static constexpr size_t nodeCount(size_t n) {
    return (n + kElementCount - 1) / kElementCount;
  }

  /**
   * Return the total byte size needed to represent n values, rounded up
   * to the nearest full node.
   */
  static constexpr size_t paddedByteSize(size_t n) {
    return nodeCount(n) * NS;
  }

  /**
   * Return the number of bytes used for padding n values.
   * Note that, even if n is a multiple of kElementCount, this may
   * return non-zero if kPaddingBytes != 0, as the padding at the end of
   * the last node is not included in the result.
   */
  static constexpr size_t paddingBytes(size_t n) {
    return (
        n ? (kPaddingBytes +
             (kElementCount - 1 - (n - 1) % kElementCount) * sizeof(T))
          : 0);
  }

  /**
   * Return the minimum byte size needed to represent n values.
   * Does not round up.  Even if n is a multiple of kElementCount, this
   * may be different from paddedByteSize() if kPaddingBytes != 0, as
   * the padding at the end of the last node is not included in the result.
   * Note that the calculation below works for n=0 correctly (returns 0).
   */
  static constexpr size_t unpaddedByteSize(size_t n) {
    return paddedByteSize(n) - paddingBytes(n);
  }

 private:
  union Storage {
    unsigned char bytes[NS];
    T data[kElementCount];
  } storage_;
};

// We must define kElementCount and kPaddingBytes to work around a bug
// in gtest that odr-uses them.
template <class T, size_t NS>
constexpr size_t
    Node<T, NS, typename detail::NodeValid<T, NS>::type>::kNodeSize;
template <class T, size_t NS>
constexpr size_t
    Node<T, NS, typename detail::NodeValid<T, NS>::type>::kElementCount;
template <class T, size_t NS>
constexpr size_t
    Node<T, NS, typename detail::NodeValid<T, NS>::type>::kPaddingBytes;

template <class Iter>
class Iterator;

namespace detail {

template <typename Void, typename Container, typename... Args>
struct padded_emplace_back_or_push_back_ {
  static decltype(auto) go(Container& container, Args&&... args) {
    using Value = typename Container::value_type;
    return container.push_back(Value(std::forward<Args>(args)...));
  }
};

template <typename Container, typename... Args>
struct padded_emplace_back_or_push_back_<
    void_t<decltype(
        std::declval<Container&>().emplace_back(std::declval<Args>()...))>,
    Container,
    Args...> {
  static decltype(auto) go(Container& container, Args&&... args) {
    return container.emplace_back(std::forward<Args>(args)...);
  }
};

template <typename Container, typename... Args>
decltype(auto) padded_emplace_back_or_push_back(
    Container& container,
    Args&&... args) {
  using impl = padded_emplace_back_or_push_back_<void, Container, Args...>;
  return impl::go(container, std::forward<Args>(args)...);
}

// Helper class to transfer the constness from From (a lvalue reference)
// and create a lvalue reference to To.
//
// TransferReferenceConstness<const string&, int> -> const int&
// TransferReferenceConstness<string&, int> -> int&
// TransferReferenceConstness<string&, const int> -> const int&
template <class From, class To, class Enable = void>
struct TransferReferenceConstness;

template <class From, class To>
struct TransferReferenceConstness<
    From,
    To,
    typename std::enable_if<std::is_const<
        typename std::remove_reference<From>::type>::value>::type> {
  typedef typename std::add_lvalue_reference<
      typename std::add_const<To>::type>::type type;
};

template <class From, class To>
struct TransferReferenceConstness<
    From,
    To,
    typename std::enable_if<!std::is_const<
        typename std::remove_reference<From>::type>::value>::type> {
  typedef typename std::add_lvalue_reference<To>::type type;
};

// Helper class template to define a base class for Iterator (below) and save
// typing.
template <class Iter>
struct IteratorBase {
  typedef boost::iterator_adaptor<
      // CRTC
      Iterator<Iter>,
      // Base iterator type
      Iter,
      // Value type
      typename std::iterator_traits<Iter>::value_type::value_type,
      // Category or traversal
      boost::use_default,
      // Reference type
      typename detail::TransferReferenceConstness<
          typename std::iterator_traits<Iter>::reference,
          typename std::iterator_traits<Iter>::value_type::value_type>::type>
      type;
};

} // namespace detail

/**
 * Wrapper around iterators to Node to return iterators to the underlying
 * node elements.
 */
template <class Iter>
class Iterator : public detail::IteratorBase<Iter>::type {
  typedef typename detail::IteratorBase<Iter>::type Super;

 public:
  typedef typename std::iterator_traits<Iter>::value_type Node;

  Iterator() : pos_(0) {}

  explicit Iterator(Iter base) : Super(base), pos_(0) {}

  // Return the current node and the position inside the node
  const Node& node() const {
    return *this->base_reference();
  }
  size_t pos() const {
    return pos_;
  }

 private:
  typename Super::reference dereference() const {
    return (*this->base_reference()).data()[pos_];
  }

  bool equal(const Iterator& other) const {
    return (
        this->base_reference() == other.base_reference() && pos_ == other.pos_);
  }

  void advance(typename Super::difference_type n) {
    constexpr ssize_t elementCount = Node::kElementCount; // signed!
    ssize_t newPos = pos_ + n;
    if (newPos >= 0 && newPos < elementCount) {
      pos_ = newPos;
      return;
    }
    ssize_t nblocks = newPos / elementCount;
    newPos %= elementCount;
    if (newPos < 0) {
      --nblocks; // negative
      newPos += elementCount;
    }
    this->base_reference() += nblocks;
    pos_ = newPos;
  }

  void increment() {
    if (++pos_ == Node::kElementCount) {
      ++this->base_reference();
      pos_ = 0;
    }
  }

  void decrement() {
    if (--pos_ == -1) {
      --this->base_reference();
      pos_ = Node::kElementCount - 1;
    }
  }

  typename Super::difference_type distance_to(const Iterator& other) const {
    constexpr ssize_t elementCount = Node::kElementCount; // signed!
    ssize_t nblocks =
        std::distance(this->base_reference(), other.base_reference());
    return nblocks * elementCount + (other.pos_ - pos_);
  }

  friend class boost::iterator_core_access;
  ssize_t pos_; // signed for easier advance() implementation
};

/**
 * Given a container to Node, return iterators to the first element in
 * the first Node / one past the last element in the last Node.
 * Note that the last node is assumed to be full; if that's not the case,
 * subtract from end() as appropriate.
 */

template <class Container>
Iterator<typename Container::const_iterator> cbegin(const Container& c) {
  return Iterator<typename Container::const_iterator>(std::begin(c));
}

template <class Container>
Iterator<typename Container::const_iterator> cend(const Container& c) {
  return Iterator<typename Container::const_iterator>(std::end(c));
}

template <class Container>
Iterator<typename Container::const_iterator> begin(const Container& c) {
  return cbegin(c);
}

template <class Container>
Iterator<typename Container::const_iterator> end(const Container& c) {
  return cend(c);
}

template <class Container>
Iterator<typename Container::iterator> begin(Container& c) {
  return Iterator<typename Container::iterator>(std::begin(c));
}

template <class Container>
Iterator<typename Container::iterator> end(Container& c) {
  return Iterator<typename Container::iterator>(std::end(c));
}

/**
 * Adaptor around a STL sequence container.
 *
 * Converts a sequence of Node into a sequence of its underlying elements
 * (with enough functionality to make it useful, although it's not fully
 * compatible with the STL containre requiremenets, see below).
 *
 * Provides iterators (of the same category as those of the underlying
 * container), size(), front(), back(), push_back(), pop_back(), and const /
 * non-const versions of operator[] (if the underlying container supports
 * them).  Does not provide push_front() / pop_front() or arbitrary insert /
 * emplace / erase.  Also provides reserve() / capacity() if supported by the
 * underlying container.
 *
 * Yes, it's called Adaptor, not Adapter, as that's the name used by the STL
 * and by boost.  Deal with it.
 *
 * Internally, we hold a container of Node and the number of elements in
 * the last block.  We don't keep empty blocks, so the number of elements in
 * the last block is always between 1 and Node::kElementCount (inclusive).
 * (this is true if the container is empty as well to make push_back() simpler,
 * see the implementation of the size() method for details).
 */
template <class Container>
class Adaptor {
 public:
  typedef typename Container::value_type Node;
  typedef typename Node::value_type value_type;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef Iterator<typename Container::iterator> iterator;
  typedef Iterator<typename Container::const_iterator> const_iterator;
  typedef typename const_iterator::difference_type difference_type;
  typedef typename Container::size_type size_type;

  static constexpr size_t kElementsPerNode = Node::kElementCount;
  // Constructors
  Adaptor() : lastCount_(Node::kElementCount) {}
  explicit Adaptor(Container c, size_t lastCount = Node::kElementCount)
      : c_(std::move(c)), lastCount_(lastCount) {}
  explicit Adaptor(size_t n, const value_type& value = value_type())
      : c_(Node::nodeCount(n), fullNode(value)) {
    const auto count = n % Node::kElementCount;
    lastCount_ = count != 0 ? count : Node::kElementCount;
  }

  Adaptor(const Adaptor&) = default;
  Adaptor& operator=(const Adaptor&) = default;
  Adaptor(Adaptor&& other) noexcept
      : c_(std::move(other.c_)), lastCount_(other.lastCount_) {
    other.lastCount_ = Node::kElementCount;
  }
  Adaptor& operator=(Adaptor&& other) {
    if (this != &other) {
      c_ = std::move(other.c_);
      lastCount_ = other.lastCount_;
      other.lastCount_ = Node::kElementCount;
    }
    return *this;
  }

  // Iterators
  const_iterator cbegin() const {
    return const_iterator(c_.begin());
  }
  const_iterator cend() const {
    auto it = const_iterator(c_.end());
    if (lastCount_ != Node::kElementCount) {
      it -= (Node::kElementCount - lastCount_);
    }
    return it;
  }
  const_iterator begin() const {
    return cbegin();
  }
  const_iterator end() const {
    return cend();
  }
  iterator begin() {
    return iterator(c_.begin());
  }
  iterator end() {
    auto it = iterator(c_.end());
    if (lastCount_ != Node::kElementCount) {
      it -= difference_type(Node::kElementCount - lastCount_);
    }
    return it;
  }
  void swap(Adaptor& other) {
    using std::swap;
    swap(c_, other.c_);
    swap(lastCount_, other.lastCount_);
  }
  bool empty() const {
    return c_.empty();
  }
  size_type size() const {
    return (
        c_.empty() ? 0 : (c_.size() - 1) * Node::kElementCount + lastCount_);
  }
  size_type max_size() const {
    return (
        (c_.max_size() <=
         std::numeric_limits<size_type>::max() / Node::kElementCount)
            ? c_.max_size() * Node::kElementCount
            : std::numeric_limits<size_type>::max());
  }

  const value_type& front() const {
    assert(!empty());
    return c_.front().data()[0];
  }
  value_type& front() {
    assert(!empty());
    return c_.front().data()[0];
  }

  const value_type& back() const {
    assert(!empty());
    return c_.back().data()[lastCount_ - 1];
  }
  value_type& back() {
    assert(!empty());
    return c_.back().data()[lastCount_ - 1];
  }

  template <typename... Args>
  void emplace_back(Args&&... args) {
    new (allocate_back()) value_type(std::forward<Args>(args)...);
  }

  void push_back(value_type x) {
    emplace_back(std::move(x));
  }

  void pop_back() {
    assert(!empty());
    if (--lastCount_ == 0) {
      c_.pop_back();
      lastCount_ = Node::kElementCount;
    }
  }

  void clear() {
    c_.clear();
    lastCount_ = Node::kElementCount;
  }

  void reserve(size_type n) {
    assert(n >= 0);
    c_.reserve(Node::nodeCount(n));
  }

  size_type capacity() const {
    return c_.capacity() * Node::kElementCount;
  }

  const value_type& operator[](size_type idx) const {
    return c_[idx / Node::kElementCount].data()[idx % Node::kElementCount];
  }
  value_type& operator[](size_type idx) {
    return c_[idx / Node::kElementCount].data()[idx % Node::kElementCount];
  }

  /**
   * Return the underlying container and number of elements in the last block,
   * and clear *this.  Useful when you want to process the data as Nodes
   * (again) and want to avoid copies.
   */
  std::pair<Container, size_t> move() {
    std::pair<Container, size_t> p(std::move(c_), lastCount_);
    lastCount_ = Node::kElementCount;
    return std::move(p);
  }

  /**
   * Return a const reference to the underlying container and the current
   * number of elements in the last block.
   */
  std::pair<const Container&, size_t> peek() const {
    return std::make_pair(std::cref(c_), lastCount_);
  }

  void padToFullNode(const value_type& padValue) {
    // the if is necessary because c_ may be empty so we can't call c_.back()
    if (lastCount_ != Node::kElementCount) {
      auto last = c_.back().data();
      std::fill(last + lastCount_, last + Node::kElementCount, padValue);
      lastCount_ = Node::kElementCount;
    }
  }

 private:
  value_type* allocate_back() {
    if (lastCount_ == Node::kElementCount) {
      detail::padded_emplace_back_or_push_back(c_);
      lastCount_ = 0;
    }
    return &c_.back().data()[lastCount_++];
  }

  static Node fullNode(const value_type& value) {
    Node n;
    std::fill(n.data(), n.data() + kElementsPerNode, value);
    return n;
  }
  Container c_; // container of Nodes
  size_t lastCount_; // number of elements in last Node
};

} // namespace padded
} // namespace folly
