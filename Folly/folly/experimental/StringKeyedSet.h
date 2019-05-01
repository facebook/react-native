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
#include <memory>
#include <set>

#include <folly/Range.h>
#include <folly/experimental/StringKeyedCommon.h>

namespace folly {

/**
 * Wrapper class for set<string> that can
 * perform lookup operations with StringPiece, not only string.
 *
 * It uses kind of hack: string pointed by StringPiece is copied when
 * StringPiece is inserted into set
 */
template <
    class Compare = std::less<StringPiece>,
    class Alloc = std::allocator<StringPiece>>
class StringKeyedSetBase : private std::set<StringPiece, Compare, Alloc> {
 private:
  using Base = std::set<StringPiece, Compare, Alloc>;

 public:
  typedef typename Base::key_type key_type;
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
  typedef typename Base::size_type size_type;
  typedef typename Base::difference_type difference_type;

  explicit StringKeyedSetBase(
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : Base(comp, alloc) {}

  explicit StringKeyedSetBase(const allocator_type& alloc) : Base(alloc) {}

  template <class InputIterator>
  StringKeyedSetBase(
      InputIterator b,
      InputIterator e,
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : Base(comp, alloc) {
    for (; b != e; ++b) {
      emplace(*b);
    }
  }

  StringKeyedSetBase(const StringKeyedSetBase& rhs)
      : StringKeyedSetBase(rhs, rhs.get_allocator()) {}

  StringKeyedSetBase(const StringKeyedSetBase& rhs, const allocator_type& a)
      : StringKeyedSetBase(rhs.begin(), rhs.end(), rhs.key_comp(), a) {}

  StringKeyedSetBase(StringKeyedSetBase&& other) noexcept
      : Base(std::move(other)) {
    assert(other.empty());
  }

  StringKeyedSetBase(
      StringKeyedSetBase&& other,
      const allocator_type& alloc) noexcept
      : Base(std::move(other), alloc) {
    assert(other.empty());
  }

  StringKeyedSetBase(
      std::initializer_list<value_type> il,
      const key_compare& comp = key_compare(),
      const allocator_type& alloc = allocator_type())
      : StringKeyedSetBase(il.begin(), il.end(), comp, alloc) {}

  StringKeyedSetBase& operator=(const StringKeyedSetBase& other) {
    if (this == &other) {
      return *this;
    }
    return *this = StringKeyedSetBase(other);
  }

  StringKeyedSetBase& operator=(StringKeyedSetBase&& other) noexcept {
    assert(this != &other);
    clear();
    Base::operator=(std::move(other));
    assert(other.empty());
    return *this;
  }

  using Base::begin;
  using Base::cbegin;
  using Base::cend;
  using Base::count;
  using Base::empty;
  using Base::end;
  using Base::find;
  using Base::lower_bound;
  using Base::max_size;
  using Base::size;
  using Base::upper_bound;

  bool operator==(StringKeyedSetBase const& other) const {
    Base const& lhs = *this;
    Base const& rhs = static_cast<Base const&>(other);
    return lhs == rhs;
  }

  template <class... Args>
  std::pair<iterator, bool> emplace(Args&&... args) {
    auto key = StringPiece(std::forward<Args>(args)...);
    auto it = find(key);
    if (it != end()) {
      return {it, false};
    }
    return Base::emplace(stringPieceDup(key, get_allocator()));
  }

  std::pair<iterator, bool> insert(value_type val) {
    auto it = find(val);
    if (it != end()) {
      return {it, false};
    }
    return Base::insert(stringPieceDup(val, get_allocator()));
  }

  iterator erase(const_iterator position) {
    auto key = *position;
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
    for (auto it : *this) {
      stringPieceDel(it, get_allocator());
    }
    Base::clear();
  }

  using Base::get_allocator;

  void swap(StringKeyedSetBase& other) & {
    return Base::swap(other);
  }

  ~StringKeyedSetBase() {
    // Here we assume that set doesn't use keys in destructor
    for (auto it : *this) {
      stringPieceDel(it, get_allocator());
    }
  }
};

using StringKeyedSet = StringKeyedSetBase<>;

} // namespace folly
