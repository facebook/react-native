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

#pragma once

#include <iterator>
#include <type_traits>

#include <boost/iterator/iterator_adaptor.hpp>

namespace folly {

template <class BaseIter>
class BitIterator;

namespace bititerator_detail {

// Reference to a bit.
// Templatize on both parent reference and value types to capture
// const-ness correctly and to work with the case where Ref is a
// reference-like type (not T&), just like our BitReference here.
template <class Ref, class Value>
class BitReference {
 public:
  BitReference(Ref r, size_t bit) : ref_(r), bit_(bit) {}

  /* implicit */ operator bool() const {
    return ref_ & (one_ << bit_);
  }

  BitReference& operator=(bool b) {
    if (b) {
      set();
    } else {
      clear();
    }
    return *this;
  }

  void set() {
    ref_ |= (one_ << bit_);
  }

  void clear() {
    ref_ &= ~(one_ << bit_);
  }

  void flip() {
    ref_ ^= (one_ << bit_);
  }

 private:
  // shortcut to avoid writing static_cast everywhere
  const static Value one_ = 1;

  Ref ref_;
  size_t bit_;
};

template <class BaseIter>
struct BitIteratorBase {
  static_assert(
      std::is_integral<
          typename std::iterator_traits<BaseIter>::value_type>::value,
      "BitIterator may only be used with integral types");
  typedef boost::iterator_adaptor<
      BitIterator<BaseIter>, // Derived
      BaseIter, // Base
      bool, // Value
      boost::use_default, // CategoryOrTraversal
      bititerator_detail::BitReference<
          typename std::iterator_traits<BaseIter>::reference,
          typename std::iterator_traits<BaseIter>::value_type>, // Reference
      ssize_t>
      type;
};

} // namespace bititerator_detail
} // namespace folly
