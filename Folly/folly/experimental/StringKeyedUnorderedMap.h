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
#include <unordered_map>
#include <utility>

#include <folly/Hash.h>
#include <folly/Range.h>
#include <folly/experimental/StringKeyedCommon.h>

namespace folly {

/**
 * Wrapper class for unordered_map<string, Value> that can
 * perform lookup operations with StringPiece, not only string.
 *
 * It uses kind of hack: string pointed by StringPiece is copied when
 * StringPiece is inserted into map
 */
template <
    class Value,
    class Hash = Hash,
    class Eq = std::equal_to<StringPiece>,
    class Alloc = std::allocator<std::pair<const StringPiece, Value>>>
class StringKeyedUnorderedMap
    : private std::unordered_map<StringPiece, Value, Hash, Eq, Alloc> {
 private:
  using Base = std::unordered_map<StringPiece, Value, Hash, Eq, Alloc>;

public:
  typedef typename Base::key_type key_type;
  typedef typename Base::mapped_type mapped_type;
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

  explicit StringKeyedUnorderedMap() = default;

  explicit StringKeyedUnorderedMap(
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : Base(n, hf, eql, alloc) {
  }

  explicit StringKeyedUnorderedMap(const allocator_type& a)
      : Base(a) {
  }

  template <class InputIterator>
  StringKeyedUnorderedMap(InputIterator b, InputIterator e) {
    for (; b != e; ++b) {
      // insert() will carry the duplication
      emplace(b->first, b->second);
    }
  }

  template <class InputIterator>
  StringKeyedUnorderedMap(
    InputIterator b, InputIterator e,
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : Base(n, hf, eql, alloc) {
    for (; b != e; ++b) {
      // insert() will carry the duplication
      emplace(b->first, b->second);
    }
  }

  StringKeyedUnorderedMap(const StringKeyedUnorderedMap& rhs)
      : StringKeyedUnorderedMap(rhs.begin(), rhs.end(),
             rhs.bucket_count(),
             rhs.hash_function(),
             rhs.key_eq(),
             rhs.get_allocator()) {
  }

  StringKeyedUnorderedMap(StringKeyedUnorderedMap&& rhs) noexcept
      : StringKeyedUnorderedMap(std::move(rhs), rhs.get_allocator()) {
  }

  StringKeyedUnorderedMap(StringKeyedUnorderedMap&& other,
                          const allocator_type& /* a */) noexcept
      : Base(std::move(other) /*, a*/ /* not supported by gcc */) {}

  StringKeyedUnorderedMap(std::initializer_list<value_type> il)
      : StringKeyedUnorderedMap(il.begin(), il.end()) {
  }

  StringKeyedUnorderedMap(
    std::initializer_list<value_type> il,
    size_type n,
    const hasher& hf = hasher(),
    const key_equal& eql = key_equal(),
    const allocator_type& alloc = allocator_type())
      : StringKeyedUnorderedMap(il.begin(), il.end(), n, hf, eql, alloc) {
  }

  StringKeyedUnorderedMap& operator=(const StringKeyedUnorderedMap& other) & {
    if (this == &other) {
      return *this;
    }
    return *this = StringKeyedUnorderedMap(other);
  }

  StringKeyedUnorderedMap&
  operator=(StringKeyedUnorderedMap&& other) & noexcept {
    assert(this != &other);
    clear();
    Base::operator=(std::move(other));
    return *this;
  }

  using Base::empty;
  using Base::size;
  using Base::max_size;
  using Base::begin;
  using Base::end;
  using Base::cbegin;
  using Base::cend;

  bool operator==(const StringKeyedUnorderedMap& rhs) {
    const Base& lhs = *this;
    return lhs == rhs;
  }

  // No need for copy/move overload as StringPiece is small struct.
  mapped_type& operator[](StringPiece key) {
    auto it = find(key);
    if (it != end()) {
      return it->second;
    }
    // operator[] will create new (key, value) pair
    // we need to allocate memory for key
    return Base::operator[](stringPieceDup(key, get_allocator()));
  }

  using Base::at;
  using Base::find;
  using Base::count;

  template <class... Args>
  std::pair<iterator, bool> emplace(StringPiece key, Args&&... args) {
    auto it = find(key);
    if (it != end()) {
      return {it, false};
    }
    return Base::emplace(stringPieceDup(key, get_allocator()),
                         std::forward<Args>(args)...);
  }

  std::pair<iterator, bool> insert(value_type val) {
    auto it = find(val.first);
    if (it != end()) {
      return {it, false};
    }
    auto valCopy = std::make_pair(stringPieceDup(val.first, get_allocator()),
                                  std::move(val.second));
    return Base::insert(valCopy);
  }

  iterator erase(const_iterator position) {
    auto key = position->first;
    auto result = Base::erase(position);
    stringPieceDel(key, get_allocator());
    return result;
  }

  size_type erase(StringPiece key) {
    auto it = find(key);
    if (it == end()) {
      return 0;
    }
    erase(it);
    return 1;
  }

  void clear() noexcept {
    for (auto& it : *this) {
      stringPieceDel(it.first, get_allocator());
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

  ~StringKeyedUnorderedMap() {
    // Here we assume that unordered_map doesn't use keys in destructor
    for (auto& it : *this) {
      stringPieceDel(it.first, get_allocator());
    }
  }
};

} // folly
