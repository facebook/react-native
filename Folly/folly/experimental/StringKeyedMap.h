/*
 * Copyright 2015-present Facebook, Inc.
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

#include <initializer_list>
#include <map>
#include <memory>

#include <folly/Range.h>
#include <folly/experimental/StringKeyedCommon.h>

namespace folly {

/**
 * Wrapper class for map<string, Value> that can
 * perform lookup operations with StringPiece, not only string.
 *
 * It uses kind of hack: string pointed by StringPiece is copied when
 * StringPiece is inserted into map
 */
template <
    class Value,
    class Compare = std::less<StringPiece>,
    class Alloc = std::allocator<std::pair<const StringPiece, Value>>>
class StringKeyedMap : private std::map<StringPiece, Value, Compare, Alloc> {
 private:
  using Base = std::map<StringPiece, Value, Compare, Alloc>;

 public:
  typedef typename Base::key_type key_type;
  typedef typename Base::mapped_type mapped_type;
  typedef typename Base::value_type value_type;
  typedef typename Base::key_compare key_compare;
  typedef typename Base::allocator_type allocator_type;
  typedef typename Base::reference reference;
  typedef typename Base::const_reference const_reference;
  typedef typename Base::pointer pointer;
  typedef typename Base::const_pointer const_pointer;
  typedef typename Base::iterator iterator;
  typedef typename Base::const_iterator const_iterator;
  typedef typename Base::reverse_iterator reverse_iterator;
  typedef typename Base::const_reverse_iterator const_reverse_iterator;
  typedef typename Base::difference_type difference_type;
  typedef typename Base::size_type size_type;

  using Base::get_allocator;

  // Ctors in the same order as
  // http://cplusplus.com/reference/map/map/map/
  explicit StringKeyedMap(
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : Base(comp, alloc) {}

  explicit StringKeyedMap(const allocator_type& alloc) : Base(alloc) {}

  template <class InputIterator>
  explicit StringKeyedMap(
      InputIterator b,
      InputIterator e,
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : Base(comp, alloc) {
    for (; b != e; ++b) {
      // emplace() will carry the duplication
      emplace(b->first, b->second);
    }
  }

  StringKeyedMap(const StringKeyedMap& rhs)
      : StringKeyedMap(rhs, rhs.get_allocator()) {}

  StringKeyedMap(const StringKeyedMap& rhs, const allocator_type& a)
      : StringKeyedMap(rhs.begin(), rhs.end(), rhs.key_comp(), a) {}

  StringKeyedMap(StringKeyedMap&& other) noexcept : Base(std::move(other)) {}

  StringKeyedMap(StringKeyedMap&& other, const allocator_type& /* a */) noexcept
      : Base(std::move(other) /*, a*/ /* not supported by gcc */) {}

  StringKeyedMap(
      std::initializer_list<value_type> il,
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : StringKeyedMap(il.begin(), il.end(), comp, alloc) {}

  StringKeyedMap& operator=(const StringKeyedMap& other) & {
    if (this == &other) {
      return *this;
    }
    return *this = StringKeyedMap(other);
  }

  StringKeyedMap& operator=(StringKeyedMap&& other) & noexcept {
    assert(this != &other);
    clear();
    Base::operator=(std::move(other));
    return *this;
  }

  using Base::begin;
  using Base::cbegin;
  using Base::cend;
  using Base::crbegin;
  using Base::crend;
  using Base::empty;
  using Base::end;
  using Base::max_size;
  using Base::rbegin;
  using Base::rend;
  using Base::size;

  bool operator==(StringKeyedMap const& other) const {
    Base const& lhs = *this;
    Base const& rhs = static_cast<Base const&>(other);
    return lhs == rhs;
  }

  // no need for copy/move overload as StringPiece is small struct
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
  using Base::count;
  using Base::find;
  using Base::lower_bound;
  using Base::upper_bound;

  template <class... Args>
  std::pair<iterator, bool> emplace(StringPiece key, Args&&... args) {
    auto it = find(key);
    if (it != end()) {
      return {it, false};
    }
    return Base::emplace(
        stringPieceDup(key, get_allocator()), std::forward<Args>(args)...);
  }

  std::pair<iterator, bool> insert(value_type val) {
    auto it = find(val.first);
    if (it != end()) {
      return {it, false};
    }
    return Base::insert(std::make_pair(
        stringPieceDup(val.first, get_allocator()), std::move(val.second)));
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

  using Base::swap;

  ~StringKeyedMap() {
    // Here we assume that map doesn't use keys in destructor
    for (auto& it : *this) {
      stringPieceDel(it.first, get_allocator());
    }
  }
};

} // namespace folly
