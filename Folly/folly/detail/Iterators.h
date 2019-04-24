/*
 * Copyright 2014-present Facebook, Inc.
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

#include <cstddef>
#include <iterator>
#include <type_traits>

/*
 * This contains stripped-down workalikes of some Boost classes:
 *
 *   iterator_adaptor
 *   iterator_facade
 *
 * Rationale: the boost headers providing those classes are surprisingly large.
 * The bloat comes from the headers themselves, but more so, their transitive
 * includes.
 *
 * These implementations are simple and minimal.  They may be missing features
 * provided by the Boost classes mentioned above.  Also at this time they only
 * support forward-iterators.  They provide just enough for the few uses within
 * Folly libs; more features will be slapped in here if and when they're needed.
 *
 * These classes may possibly add features as well.  Care is taken not to
 * change functionality where it's expected to be the same (e.g. `dereference`
 * will do the same thing).
 *
 * These are currently only intended for use within Folly, hence their living
 * under detail.  Use outside Folly is not recommended.
 *
 * To see how to use these classes, find the instances where this is used within
 * Folly libs.  Common use cases can also be found in `IteratorsTest.cpp`.
 */

namespace folly {
namespace detail {

/**
 * Currently this only supports forward iteration.  The derived class must
 * must have definitions for these three methods:
 *
 *   void increment();
 *   reference dereference() const;
 *   bool equal([appropriate iterator type] const& rhs) const;
 *
 * These names are consistent with those used by the Boost iterator
 * facade / adaptor classes to ease migration classes in this file.
 *
 * Template parameters:
 * D: the deriving class (CRTP)
 * V: value type
 */
template <class D, class V>
class IteratorFacade {
 public:
  using value_type = V;
  using reference = value_type&;
  using pointer = value_type*;
  using difference_type = ssize_t;
  using iterator_category = std::forward_iterator_tag;

  bool operator==(D const& rhs) const {
    return asDerivedConst().equal(rhs);
  }

  bool operator!=(D const& rhs) const {
    return !operator==(rhs);
  }

  /*
   * Allow for comparisons between this and an iterator of some other class.
   * (e.g. a const_iterator version of this, the probable use case).
   * Does a conversion of D (or D reference) to D2, if one exists (otherwise
   * this is disabled).  Disabled if D and D2 are the same, to disambiguate
   * this and the `operator==(D const&) const` method above.
   */

  template <class D2>
  typename std::enable_if<std::is_convertible<D, D2>::value, bool>::type
  operator==(D2 const& rhs) const {
    return D2(asDerivedConst()) == rhs;
  }

  template <class D2>
  bool operator!=(D2 const& rhs) const {
    return !operator==(rhs);
  }

  V& operator*() const {
    return asDerivedConst().dereference();
  }

  V* operator->() const {
    return std::addressof(operator*());
  }

  D& operator++() {
    asDerived().increment();
    return asDerived();
  }

  D operator++(int) {
    auto ret = asDerived(); // copy
    asDerived().increment();
    return ret;
  }

 private:
  D& asDerived() {
    return static_cast<D&>(*this);
  }

  D const& asDerivedConst() const {
    return static_cast<D const&>(*this);
  }
};

/**
 * Wrap one iterator while providing an interator interface with e.g. a
 * different value_type.
 *
 * Template parameters:
 * D: the deriving class (CRTP)
 * I: the wrapper iterator type
 * V: value type
 */
template <class D, class I, class V>
class IteratorAdaptor : public IteratorFacade<D, V> {
 public:
  using Super = IteratorFacade<D, V>;
  using value_type = typename Super::value_type;
  using iterator_category = typename Super::iterator_category;
  using reference = typename Super::reference;
  using pointer = typename Super::pointer;
  using difference_type = typename Super::difference_type;

  explicit IteratorAdaptor(I base) : base_(base) {}
  void increment() {
    ++base_;
  }

  V& dereference() const {
    return *base_;
  }

  bool equal(D const& rhs) const {
    return base_ == rhs.base_;
  }

  I const& base() const {
    return base_;
  }
  I& base() {
    return base_;
  }

 private:
  I base_;
};

} // namespace detail
} // namespace folly
