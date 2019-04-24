/*
 * Copyright 2016-present Facebook, Inc.
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

#include <map>

#include <folly/container/Array.h>
#include <folly/detail/Iterators.h>
#include <folly/portability/GTest.h>

using namespace folly::detail;
using namespace folly;

namespace {
struct IntArrayIterator : IteratorFacade<IntArrayIterator, int const> {
  explicit IntArrayIterator(int const* a) : a_(a) {}
  void increment() {
    ++a_;
  }
  int const& dereference() const {
    return *a_;
  }
  bool equal(IntArrayIterator const& rhs) const {
    return rhs.a_ == a_;
  }
  int const* a_;
};
} // namespace

TEST(IteratorsTest, IterFacadeHasCorrectTraits) {
  using TR = std::iterator_traits<IntArrayIterator>;
  static_assert(std::is_same<TR::value_type, int const>::value, "");
  static_assert(std::is_same<TR::reference, int const&>::value, "");
  static_assert(std::is_same<TR::pointer, int const*>::value, "");
  static_assert(
      std::is_same<TR::iterator_category, std::forward_iterator_tag>::value,
      "");
  static_assert(std::is_same<TR::difference_type, ssize_t>::value, "");
}

TEST(IteratorsTest, SimpleIteratorFacade) {
  static const auto kArray = folly::make_array(42, 43, 44);
  IntArrayIterator end(kArray.data() + kArray.size());
  IntArrayIterator iter(kArray.data());
  EXPECT_NE(iter, end);
  EXPECT_EQ(42, *iter);
  ++iter;
  EXPECT_NE(iter, end);
  EXPECT_EQ(43, *iter);
  ++iter;
  EXPECT_NE(iter, end);
  EXPECT_EQ(44, *iter);
  ++iter;
  EXPECT_EQ(iter, end);
}

namespace {
// Simple iterator adaptor: wraps an int pointer.
struct IntPointerIter : IteratorAdaptor<IntPointerIter, int const*, int const> {
  using Super = IteratorAdaptor<IntPointerIter, int const*, int const>;
  explicit IntPointerIter(int const* ptr) : Super(ptr) {}
};
} // namespace

TEST(IteratorsTest, IterAdaptorHasCorrectTraits) {
  using TR = std::iterator_traits<IntPointerIter>;
  static_assert(std::is_same<TR::value_type, int const>::value, "");
  static_assert(std::is_same<TR::reference, int const&>::value, "");
  static_assert(std::is_same<TR::pointer, int const*>::value, "");
  static_assert(
      std::is_same<TR::iterator_category, std::forward_iterator_tag>::value,
      "");
  static_assert(std::is_same<TR::difference_type, ssize_t>::value, "");
}

TEST(IteratorsTest, IterAdaptorWithPointer) {
  static const auto kArray = folly::make_array(42, 43, 44);
  IntPointerIter end(kArray.data() + kArray.size());
  IntPointerIter iter(kArray.data());
  EXPECT_NE(iter, end);
  EXPECT_EQ(42, *iter);
  ++iter;
  EXPECT_NE(iter, end);
  EXPECT_EQ(43, *iter);
  ++iter;
  EXPECT_NE(iter, end);
  EXPECT_EQ(44, *iter);
  ++iter;
  EXPECT_EQ(iter, end);
}

namespace {
// More complex case: wrap a map iterator, but these provide either the key or
// value.
struct IntMapKeyIter
    : IteratorAdaptor<IntMapKeyIter, std::map<int, int>::iterator, int const> {
  using Super =
      IteratorAdaptor<IntMapKeyIter, std::map<int, int>::iterator, int const>;
  explicit IntMapKeyIter(std::map<int, int>::iterator iter) : Super(iter) {}
  int const& dereference() const {
    return base()->first;
  }
};

struct IntMapValueIter
    : IteratorAdaptor<IntMapValueIter, std::map<int, int>::iterator, int> {
  using Super =
      IteratorAdaptor<IntMapValueIter, std::map<int, int>::iterator, int>;
  explicit IntMapValueIter(std::map<int, int>::iterator iter) : Super(iter) {}
  int& dereference() const {
    return base()->second;
  }
};

} // namespace

TEST(IteratorsTest, IterAdaptorOfOtherIter) {
  std::map<int, int> m{{2, 42}, {3, 43}, {4, 44}};

  IntMapKeyIter keyEnd(m.end());
  IntMapKeyIter keyIter(m.begin());
  EXPECT_NE(keyIter, keyEnd);
  EXPECT_EQ(2, *keyIter);
  ++keyIter;
  EXPECT_NE(keyIter, keyEnd);
  EXPECT_EQ(3, *keyIter);
  ++keyIter;
  EXPECT_NE(keyIter, keyEnd);
  EXPECT_EQ(4, *keyIter);
  ++keyIter;
  EXPECT_EQ(keyIter, keyEnd);

  IntMapValueIter valueEnd(m.end());
  IntMapValueIter valueIter(m.begin());
  EXPECT_NE(valueIter, valueEnd);
  EXPECT_EQ(42, *valueIter);
  ++valueIter;
  EXPECT_NE(valueIter, valueEnd);
  EXPECT_EQ(43, *valueIter);
  ++valueIter;
  EXPECT_NE(valueIter, valueEnd);
  EXPECT_EQ(44, *valueIter);
  ++valueIter;
  EXPECT_EQ(valueIter, valueEnd);
}

namespace {
struct IntMapValueIterConst : IteratorAdaptor<
                                  IntMapValueIterConst,
                                  std::map<int, int>::const_iterator,
                                  int const> {
  using Super = IteratorAdaptor<
      IntMapValueIterConst,
      std::map<int, int>::const_iterator,
      int const>;
  explicit IntMapValueIterConst(std::map<int, int>::const_iterator iter)
      : Super(iter) {}
  /* implicit */ IntMapValueIterConst(IntMapValueIter const& rhs)
      : IntMapValueIterConst(rhs.base()) {}
  int const& dereference() const {
    return base()->second;
  }
};
} // namespace

TEST(IteratorsTest, MixedConstAndNonconstIters) {
  std::map<int, int> m{{2, 42}, {3, 43}, {4, 44}};
  IntMapValueIterConst cend(m.cend());
  IntMapValueIter valueIter(m.begin());
  EXPECT_NE(valueIter, cend);
  ++valueIter;
  ++valueIter;
  ++valueIter;
  EXPECT_EQ(valueIter, cend);
}
