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

#include <algorithm>
#include <cassert>
#include <cstddef>
#include <deque>
#include <functional>
#include <map>
#include <set>
#include <tuple>
#include <type_traits>
#include <utility>
#include <vector>

#include <folly/container/Iterator.h>
#include <folly/portability/GTest.h>

namespace {
/**
 * Container type used for unit tests.
 */
template <typename T>
using Container = std::deque<T>;

// Constructor and assignment operator call counters for struct Object.
std::size_t gDefaultCtrCnt;
std::size_t gCopyCtrCnt;
std::size_t gMoveCtrCnt;
std::size_t gExplicitCtrCnt;
std::size_t gMultiargCtrCnt;
std::size_t gCopyOpCnt;
std::size_t gMoveOpCnt;
std::size_t gConvertOpCnt;

/**
 * Class that increases various counters to keep track of how objects have
 * been constructed or assigned to, to verify iterator behavior.
 */
struct Object {
  Object() {
    ++gDefaultCtrCnt;
  }
  Object(const Object&) {
    ++gCopyCtrCnt;
  }
  Object(Object&&) noexcept {
    ++gMoveCtrCnt;
  }
  explicit Object(int) {
    ++gExplicitCtrCnt;
  }
  explicit Object(int, int) {
    ++gMultiargCtrCnt;
  }
  Object& operator=(const Object&) {
    ++gCopyOpCnt;
    return *this;
  }
  Object& operator=(Object&&) noexcept {
    ++gMoveOpCnt;
    return *this;
  }
  Object& operator=(int) noexcept {
    ++gConvertOpCnt;
    return *this;
  }
};

/**
 * Reset all call counters to 0.
 */
void init_counters() {
  gDefaultCtrCnt = gCopyCtrCnt = gMoveCtrCnt = gExplicitCtrCnt =
      gMultiargCtrCnt = gCopyOpCnt = gMoveOpCnt = gConvertOpCnt = 0;
}

/**
 * Test for iterator copy and move.
 */
template <typename Iterator>
void copy_and_move_test(Container<int>& q, Iterator it) {
  assert(q.empty());
  const auto it2(it); // copy construct
  it = it2; // copy assign from const
  it = it; // self assign
  auto it3(std::move(it)); // move construct
  it = std::move(it3); // move assign
  // Make sure iterator still works.
  it = 4711; // emplace
  EXPECT_EQ(q, Container<int>{4711});
}

/**
 * Test for emplacement with perfect forwarding.
 */
template <typename Iterator>
void emplace_test(Container<Object>& q, Iterator it) {
  using folly::make_emplace_args;
  assert(q.empty());
  init_counters();
  it = Object{}; // default construct + move construct
  Object obj; // default construct
  it = obj; // copy construct
  it = std::move(obj); // move construct
  const Object obj2; // default construct
  it = obj2; // copy construct from const
  it = std::move(obj2); // copy construct (const defeats move)
  it = 0; // explicit construct
  it = make_emplace_args(0, 0); // explicit multiarg construct
  it = std::make_pair(0, 0); // implicit multiarg construct
  it = std::make_tuple(0, 0); // implicit multiarg construct
  auto args = make_emplace_args(Object{}); // default construct + move construct
  it = args; // copy construct
  it = const_cast<const decltype(args)&>(args); // copy construct from const
  it = std::move(args); // move construct
  auto args2 = std::make_tuple(Object{}); // default construct + move construct
  it = args2; // (implicit multiarg) copy construct
  it = std::move(args2); // (implicit multiarg) move construct
  auto args3 = std::make_pair(0, 0);
  it = args3; // implicit multiarg construct
  it = std::move(args3); // implicit multiarg construct
  ASSERT_EQ(q.size(), 16);
  EXPECT_EQ(gDefaultCtrCnt, 5);
  EXPECT_EQ(gCopyCtrCnt, 6);
  EXPECT_EQ(gMoveCtrCnt, 6);
  EXPECT_EQ(gExplicitCtrCnt, 1);
  EXPECT_EQ(gMultiargCtrCnt, 5);
  EXPECT_EQ(gCopyOpCnt, 0);
  EXPECT_EQ(gMoveOpCnt, 0);
  EXPECT_EQ(gConvertOpCnt, 0);
}
} // namespace

using namespace folly;

/**
 * Basic tests for folly::emplace_iterator.
 */
TEST(EmplaceIterator, EmplacerTest) {
  {
    Container<int> q;
    copy_and_move_test(q, emplacer(q, q.begin()));
  }
  {
    Container<Object> q;
    emplace_test(q, emplacer(q, q.begin()));
  }
  {
    Container<int> q;
    auto it = emplacer(q, q.begin());
    it = 0;
    it = 1;
    it = 2;
    it = emplacer(q, q.begin());
    it = 3;
    it = 4;
    EXPECT_EQ(q, Container<int>({3, 4, 0, 1, 2}));
  }
}

/**
 * Basic tests for folly::front_emplace_iterator.
 */
TEST(EmplaceIterator, FrontEmplacerTest) {
  {
    Container<int> q;
    copy_and_move_test(q, front_emplacer(q));
  }
  {
    Container<Object> q;
    emplace_test(q, front_emplacer(q));
  }
  {
    Container<int> q;
    auto it = front_emplacer(q);
    it = 0;
    it = 1;
    it = 2;
    it = front_emplacer(q);
    it = 3;
    it = 4;
    EXPECT_EQ(q, Container<int>({4, 3, 2, 1, 0}));
  }
}

/**
 * Basic tests for folly::back_emplace_iterator.
 */
TEST(EmplaceIterator, BackEmplacerTest) {
  {
    Container<int> q;
    copy_and_move_test(q, back_emplacer(q));
  }
  {
    Container<Object> q;
    emplace_test(q, back_emplacer(q));
  }
  {
    Container<int> q;
    auto it = back_emplacer(q);
    it = 0;
    it = 1;
    it = 2;
    it = back_emplacer(q);
    it = 3;
    it = 4;
    EXPECT_EQ(q, Container<int>({0, 1, 2, 3, 4}));
  }
}

/**
 * Basic tests for folly::hint_emplace_iterator.
 */
TEST(EmplaceIterator, HintEmplacerTest) {
  {
    init_counters();
    std::map<int, Object> m;
    auto it = hint_emplacer(m, m.end());
    it = make_emplace_args(
        std::piecewise_construct,
        std::forward_as_tuple(0),
        std::forward_as_tuple(0));
    it = make_emplace_args(
        std::piecewise_construct,
        std::forward_as_tuple(1),
        std::forward_as_tuple(0, 0));
    it = make_emplace_args(
        std::piecewise_construct,
        std::forward_as_tuple(2),
        std::forward_as_tuple(Object{}));
    ASSERT_EQ(m.size(), 3);
    EXPECT_EQ(gDefaultCtrCnt, 1);
    EXPECT_EQ(gCopyCtrCnt, 0);
    EXPECT_EQ(gMoveCtrCnt, 1);
    EXPECT_EQ(gExplicitCtrCnt, 1);
    EXPECT_EQ(gMultiargCtrCnt, 1);
    EXPECT_EQ(gCopyOpCnt, 0);
    EXPECT_EQ(gMoveOpCnt, 0);
    EXPECT_EQ(gConvertOpCnt, 0);
  }
  {
    struct O {
      explicit O(int i_) : i(i_) {}
      bool operator<(const O& other) const {
        return i < other.i;
      }
      bool operator==(const O& other) const {
        return i == other.i;
      }
      int i;
    };
    std::vector<int> v1 = {0, 1, 2, 3, 4};
    std::vector<int> v2 = {0, 2, 4};
    std::set<O> diff;
    std::set_difference(
        v1.begin(),
        v1.end(),
        v2.begin(),
        v2.end(),
        hint_emplacer(diff, diff.end()));
    ASSERT_EQ(diff, std::set<O>({O(1), O(3)}));
  }
}

/**
 * Test std::copy() with explicit conversion. This would not compile with a
 * std::back_insert_iterator, because the constructor of Object that takes a
 * single int is explicit.
 */
TEST(EmplaceIterator, Copy) {
  init_counters();
  Container<int> in({0, 1, 2});
  Container<Object> out;
  std::copy(in.begin(), in.end(), back_emplacer(out));
  EXPECT_EQ(3, out.size());
  EXPECT_EQ(gDefaultCtrCnt, 0);
  EXPECT_EQ(gCopyCtrCnt, 0);
  EXPECT_EQ(gMoveCtrCnt, 0);
  EXPECT_EQ(gExplicitCtrCnt, 3);
  EXPECT_EQ(gMultiargCtrCnt, 0);
  EXPECT_EQ(gCopyOpCnt, 0);
  EXPECT_EQ(gMoveOpCnt, 0);
  EXPECT_EQ(gConvertOpCnt, 0);
}

/**
 * Test std::transform() with multi-argument constructors. This would require
 * a temporary Object with std::back_insert_iterator.
 */
TEST(EmplaceIterator, Transform) {
  init_counters();
  Container<int> in({0, 1, 2});
  Container<Object> out;
  std::transform(in.begin(), in.end(), back_emplacer(out), [](int i) {
    return make_emplace_args(i, i);
  });
  EXPECT_EQ(3, out.size());
  EXPECT_EQ(gDefaultCtrCnt, 0);
  EXPECT_EQ(gCopyCtrCnt, 0);
  EXPECT_EQ(gMoveCtrCnt, 0);
  EXPECT_EQ(gExplicitCtrCnt, 0);
  EXPECT_EQ(gMultiargCtrCnt, 3);
  EXPECT_EQ(gCopyOpCnt, 0);
  EXPECT_EQ(gMoveOpCnt, 0);
  EXPECT_EQ(gConvertOpCnt, 0);
}

/**
 * Test multi-argument store and forward.
 */
TEST(EmplaceIterator, EmplaceArgs) {
  Object o1;
  const Object o2;
  Object& o3 = o1;
  const Object& o4 = o3;
  Object o5;

  {
    // Test copy construction.
    auto args = make_emplace_args(0, o1, o2, o3, o4, Object{}, std::cref(o2));
    init_counters();
    auto args2 = args;
    EXPECT_EQ(gDefaultCtrCnt, 0);
    EXPECT_EQ(gCopyCtrCnt, 5);
    EXPECT_EQ(gMoveCtrCnt, 0);
    EXPECT_EQ(gExplicitCtrCnt, 0);
    EXPECT_EQ(gMultiargCtrCnt, 0);
    EXPECT_EQ(gCopyOpCnt, 0);
    EXPECT_EQ(gMoveOpCnt, 0);
    EXPECT_EQ(gConvertOpCnt, 0);

    // Test copy assignment.
    init_counters();
    args = args2;
    EXPECT_EQ(gDefaultCtrCnt, 0);
    EXPECT_EQ(gCopyCtrCnt, 0);
    EXPECT_EQ(gMoveCtrCnt, 0);
    EXPECT_EQ(gExplicitCtrCnt, 0);
    EXPECT_EQ(gMultiargCtrCnt, 0);
    EXPECT_EQ(gCopyOpCnt, 5);
    EXPECT_EQ(gMoveOpCnt, 0);
    EXPECT_EQ(gConvertOpCnt, 0);
  }

  {
    // Test RVO.
    init_counters();
    auto args = make_emplace_args(
        0, o1, o2, o3, o4, Object{}, std::cref(o2), rref(std::move(o5)));
    EXPECT_EQ(gDefaultCtrCnt, 1);
    EXPECT_EQ(gCopyCtrCnt, 4);
    EXPECT_EQ(gMoveCtrCnt, 1);
    EXPECT_EQ(gExplicitCtrCnt, 0);
    EXPECT_EQ(gMultiargCtrCnt, 0);
    EXPECT_EQ(gCopyOpCnt, 0);
    EXPECT_EQ(gMoveOpCnt, 0);
    EXPECT_EQ(gConvertOpCnt, 0);

    // Test move construction.
    init_counters();
    auto args2 = std::move(args);
    EXPECT_EQ(gDefaultCtrCnt, 0);
    EXPECT_EQ(gCopyCtrCnt, 0);
    EXPECT_EQ(gMoveCtrCnt, 5);
    EXPECT_EQ(gExplicitCtrCnt, 0);
    EXPECT_EQ(gMultiargCtrCnt, 0);
    EXPECT_EQ(gCopyOpCnt, 0);
    EXPECT_EQ(gMoveOpCnt, 0);
    EXPECT_EQ(gConvertOpCnt, 0);

    // Test move assignment.
    init_counters();
    args = std::move(args2);
    EXPECT_EQ(gDefaultCtrCnt, 0);
    EXPECT_EQ(gCopyCtrCnt, 0);
    EXPECT_EQ(gMoveCtrCnt, 0);
    EXPECT_EQ(gExplicitCtrCnt, 0);
    EXPECT_EQ(gMultiargCtrCnt, 0);
    EXPECT_EQ(gCopyOpCnt, 0);
    EXPECT_EQ(gMoveOpCnt, 5);
    EXPECT_EQ(gConvertOpCnt, 0);

    // Make sure arguments are stored correctly. lvalues by reference, rvalues
    // by (moved) copy. Rvalues cannot be stored by reference because they may
    // refer to an expired temporary by the time they are accessed.
    static_assert(
        std::is_same<
            int,
            std::tuple_element_t<0, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            Object,
            std::tuple_element_t<1, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            Object,
            std::tuple_element_t<2, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            Object,
            std::tuple_element_t<3, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            Object,
            std::tuple_element_t<4, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            Object,
            std::tuple_element_t<5, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            std::reference_wrapper<const Object>,
            std::tuple_element_t<6, decltype(args)::storage_type>>::value,
        "");
    static_assert(
        std::is_same<
            rvalue_reference_wrapper<Object>,
            std::tuple_element_t<7, decltype(args)::storage_type>>::value,
        "");

    // Check whether args.get() restores the original argument type for
    // rvalue references to emplace_args.
    static_assert(
        std::is_same<int&&, decltype(get_emplace_arg<0>(std::move(args)))>::
            value,
        "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<1>(std::move(args)))>::
            value,
        "");
    static_assert(
        std::is_same<
            const Object&,
            decltype(get_emplace_arg<2>(std::move(args)))>::value,
        "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<3>(std::move(args)))>::
            value,
        "");
    static_assert(
        std::is_same<
            const Object&,
            decltype(get_emplace_arg<4>(std::move(args)))>::value,
        "");
    static_assert(
        std::is_same<Object&&, decltype(get_emplace_arg<5>(std::move(args)))>::
            value,
        "");
    static_assert(
        std::is_same<
            const Object&,
            decltype(get_emplace_arg<6>(std::move(args)))>::value,
        "");
    static_assert(
        std::is_same<Object&&, decltype(get_emplace_arg<7>(std::move(args)))>::
            value,
        "");

    // lvalue references to emplace_args should behave mostly like std::tuples.
    // Note that get_emplace_arg<7>(args) does not compile, because
    // folly::rvalue_reference_wrappers can only be unwrapped through an rvalue
    // reference.
    static_assert(
        std::is_same<int&, decltype(get_emplace_arg<0>(args))>::value, "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<1>(args))>::value, "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<2>(args))>::value, "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<3>(args))>::value, "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<4>(args))>::value, "");
    static_assert(
        std::is_same<Object&, decltype(get_emplace_arg<5>(args))>::value, "");
    static_assert(
        std::is_same<const Object&, decltype(get_emplace_arg<6>(args))>::value,
        "");
  }
}

/**
 * Test implicit unpacking.
 */
TEST(EmplaceIterator, ImplicitUnpack) {
  static std::size_t multiCtrCnt;
  static std::size_t pairCtrCnt;
  static std::size_t tupleCtrCnt;

  struct Object2 {
    Object2(int, int) {
      ++multiCtrCnt;
    }
    explicit Object2(const std::pair<int, int>&) {
      ++pairCtrCnt;
    }
    explicit Object2(const std::tuple<int, int>&) {
      ++tupleCtrCnt;
    }
  };

  auto test = [](auto&& it, bool expectUnpack) {
    multiCtrCnt = pairCtrCnt = tupleCtrCnt = 0;
    it = std::make_pair(0, 0);
    it = std::make_tuple(0, 0);
    if (expectUnpack) {
      EXPECT_EQ(multiCtrCnt, 2);
      EXPECT_EQ(pairCtrCnt, 0);
      EXPECT_EQ(tupleCtrCnt, 0);
    } else {
      EXPECT_EQ(multiCtrCnt, 0);
      EXPECT_EQ(pairCtrCnt, 1);
      EXPECT_EQ(tupleCtrCnt, 1);
    }
  };

  Container<Object2> q;

  test(emplacer(q, q.begin()), true);
  test(emplacer<false>(q, q.begin()), false);
  test(front_emplacer(q), true);
  test(front_emplacer<false>(q), false);
  test(back_emplacer(q), true);
  test(back_emplacer<false>(q), false);
}
