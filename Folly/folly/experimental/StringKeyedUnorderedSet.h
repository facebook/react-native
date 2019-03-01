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
// Copyright 2013-present Facebook. All Rights Reserved.
// @author: Pavlo Kushnir (pavlo)

#pragma once

#include <functional>
#include <initializer_list>
#include <memory>
#include <unordered_set>
#include <utility>

#include <folly/Hash.h>
#include <folly/Range.h>
#include <folly/experimental/StringKeyedCommon.h>

namespace folly {

/**
 * Wrapper class for unordered_set<string> that can
 * perform lookup operations with StringPiece, not only string.
 *
 * It uses kind of hack: string pointed by StringPiece is copied when
 * StringPiece is inserted into set
 */
template <
    class Hasher = Hash,
    class Eq = std::equal_to<StringPiece>,
    class Alloc = std::allocator<folly::StringPiece>>
class BasicStringKeyedUnorderedSet
    : private std::unordered_set<StringPiece, Hasher, Eq, Alloc> {
  using Base = std::unordered_set<StringPiece, Hasher, Eq, Alloc>;

public:
  typedef typename Base::key_type key_type;
  typedef typename Base::value_type value_type;
  typedef typename Base::hasher hasher;
  typedef typename Base::key_equal key_equal;
  typedef typename Base::allocator_type allocator_type;
  typedef typename Base::reference reference;
  typedef typename Base::const_reference const_reference;
  typedef typename Base::pointer pointer;
  typedef typename Base::const_pointer const_pointer;
  typedef typename Base::iterator iterator;
  typedef typename Base::const_iterator const_iterator;
  typedef typename Base::size_type size_type;
  typedef typename Base::difference_type difference_type;

  // Constructors in the same order as in
  // http://cplusplus.com/reference/unordered_set/unordered_set/unordered_set/
  explicit BasicStringKeyedUnorderedSet() {
  }

  explicit BasicStringKeyedUnorderedSet(
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : Base(n, hf, eql, alloc) {
  }

  explicit BasicStringKeyedUnorderedSet(const allocator_type& alloc)
      : Base(alloc) {
  }

  template <class InputIterator>
  BasicStringKeyedUnorderedSet(InputIterator b, InputIterator e) {
    for (; b != e; ++b) {
      emplace(*b);
    }
  }

  template <class InputIterator>
  BasicStringKeyedUnorderedSet(
    InputIterator b, InputIterator e,
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : Base(n, hf, eql, alloc) {
    for (; b != e; ++b) {
      emplace(*b);
    }
  }

  BasicStringKeyedUnorderedSet(const BasicStringKeyedUnorderedSet& rhs)
      : BasicStringKeyedUnorderedSet(rhs, rhs.get_allocator()) {
  }

  BasicStringKeyedUnorderedSet(const BasicStringKeyedUnorderedSet& rhs,
                               const allocator_type& a)
      : BasicStringKeyedUnorderedSet(rhs.begin(),
                                     rhs.end(),
                                     rhs.bucket_count(),
                                     rhs.hash_function(),
                                     rhs.key_eq(),
                                     a) {
  }

  BasicStringKeyedUnorderedSet(BasicStringKeyedUnorderedSet&& rhs) noexcept
      : Base(std::move(rhs)) {
    assert(rhs.empty());
  }

  BasicStringKeyedUnorderedSet(BasicStringKeyedUnorderedSet&& rhs,
                               const allocator_type& /* a */) noexcept
      : Base(std::move(rhs) /* , a */ /* not supported by gcc */) {
    assert(rhs.empty());
  }

  BasicStringKeyedUnorderedSet(std::initializer_list<value_type> il)
      : BasicStringKeyedUnorderedSet(il.begin(), il.end()) {
  }

  BasicStringKeyedUnorderedSet(
    std::initializer_list<value_type> il,
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : BasicStringKeyedUnorderedSet(il.begin(), il.end(), n, hf, eql, alloc) {
  }

  BasicStringKeyedUnorderedSet&
  operator=(const BasicStringKeyedUnorderedSet& rhs) & {
    if (this == &rhs) {
      return *this;
    }
    // Cost is as bad as a full copy, so to it via copy + move
    return *this = BasicStringKeyedUnorderedSet(rhs);
  }

  BasicStringKeyedUnorderedSet&
  operator=(BasicStringKeyedUnorderedSet&& rhs) & noexcept {
    assert(this != &rhs);
    clear();
    Base::operator=(std::move(rhs));
    return *this;
  }

  using Base::empty;
  using Base::size;
  using Base::max_size;
  using Base::begin;
  using Base::end;
  using Base::cbegin;
  using Base::cend;
  using Base::find;

  bool operator==(const BasicStringKeyedUnorderedSet& rhs) const {
    const Base& lhs = *this;
    return lhs == rhs;
  }

  template <class... Args>
  std::pair<iterator, bool> emplace(Args&&... args) {
    auto key = StringPiece(std::forward<Args>(args)...);
    auto it = find(key);
    return it != end()
      ? std::make_pair(it, false)
      : Base::emplace(stringPieceDup(key, get_allocator()));
  }

  std::pair<iterator, bool> insert(value_type val) {
    auto it = find(val);
    return it != end()
      ? std::make_pair(it, false)
      : Base::insert(stringPieceDup(val, get_allocator()));
  }

  iterator erase(const_iterator position) {
    auto key = *position;
    auto result = Base::erase(position);
    stringPieceDel(key, get_allocator());
    return result;
  }

  size_type erase(folly::StringPiece key) {
    auto it = find(key);
    if (it == end()) {
      return 0;
    }
    erase(it);
    return 1;
  }

  void clear() noexcept {
    for (auto& it : *this) {
      stringPieceDel(it, get_allocator());
    }
    Base::clear();
  }

  using Base::reserve;
  using Base::hash_function;
  using Base::key_eq;
  using Base::get_allocator;
  using Base::bucket_count;
  using Base::max_bucket_count;
  using Base::bucket_size;
  using Base::bucket;

  ~BasicStringKeyedUnorderedSet() {
    // Here we assume that unordered_set doesn't use keys in destructor
    for (auto& it : *this) {
      stringPieceDel(it, get_allocator());
    }
  }
};

typedef BasicStringKeyedUnorderedSet<> StringKeyedUnorderedSet;

} // folly
