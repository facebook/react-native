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

#include <folly/Memory.h>
#include <folly/Arena.h>
#include <folly/String.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

#include <type_traits>
#include <utility>

using namespace folly;

TEST(make_unique, compatible_with_std_make_unique) {
  //  HACK: To enforce that `folly::` is imported here.
  to_shared_ptr(std::unique_ptr<std::string>());

  using namespace std;
  make_unique<string>("hello, world");
}

TEST(to_weak_ptr, example) {
  auto s = std::make_shared<int>(17);
  EXPECT_EQ(1, s.use_count());
  EXPECT_EQ(2, (to_weak_ptr(s).lock(), s.use_count())) << "lvalue";
  EXPECT_EQ(3, (to_weak_ptr(decltype(s)(s)).lock(), s.use_count())) << "rvalue";
}

TEST(allocate_sys_buffer, compiles) {
  auto buf = allocate_sys_buffer(256);
  //  Freed at the end of the scope.
}

template <std::size_t> struct T {};
template <std::size_t> struct S {};
template <std::size_t> struct P {};

TEST(as_stl_allocator, sanity_check) {
  typedef StlAllocator<SysArena, int> stl_arena_alloc;

  EXPECT_TRUE((std::is_same<
    as_stl_allocator<int, SysArena>::type,
    stl_arena_alloc
  >::value));

  EXPECT_TRUE((std::is_same<
    as_stl_allocator<int, stl_arena_alloc>::type,
    stl_arena_alloc
  >::value));
}

TEST(StlAllocator, void_allocator) {
  typedef StlAllocator<SysArena, void> void_allocator;
  SysArena arena;
  void_allocator valloc(&arena);

  typedef void_allocator::rebind<int>::other int_allocator;
  int_allocator ialloc(valloc);

  auto i = std::allocate_shared<int>(ialloc, 10);
  ASSERT_NE(nullptr, i.get());
  EXPECT_EQ(10, *i);
  i.reset();
  ASSERT_EQ(nullptr, i.get());
}

TEST(rebind_allocator, sanity_check) {
  std::allocator<long> alloc;

  auto i = std::allocate_shared<int>(
    rebind_allocator<int, decltype(alloc)>(alloc), 10
  );
  ASSERT_NE(nullptr, i.get());
  EXPECT_EQ(10, *i);
  i.reset();
  ASSERT_EQ(nullptr, i.get());

  auto d = std::allocate_shared<double>(
    rebind_allocator<double>(alloc), 5.6
  );
  ASSERT_NE(nullptr, d.get());
  EXPECT_EQ(5.6, *d);
  d.reset();
  ASSERT_EQ(nullptr, d.get());

  auto s = std::allocate_shared<std::string>(
    rebind_allocator<std::string>(alloc), "HELLO, WORLD"
  );
  ASSERT_NE(nullptr, s.get());
  EXPECT_EQ("HELLO, WORLD", *s);
  s.reset();
  ASSERT_EQ(nullptr, s.get());
}

template <typename C>
static void test_enable_shared_from_this(std::shared_ptr<C> sp) {
  ASSERT_EQ(1l, sp.use_count());

  // Test shared_from_this().
  std::shared_ptr<C> sp2 = sp->shared_from_this();
  ASSERT_EQ(sp, sp2);

  // Test weak_from_this().
  std::weak_ptr<C> wp = sp->weak_from_this();
  ASSERT_EQ(sp, wp.lock());
  sp.reset();
  sp2.reset();
  ASSERT_EQ(nullptr, wp.lock());

  // Test shared_from_this() and weak_from_this() on object not owned by a
  // shared_ptr. Undefined in C++14 but well-defined in C++17. Also known to
  // work with libstdc++ >= 20150123. Feel free to add other standard library
  // versions where the behavior is known.
#if __cplusplus >= 201700L || \
    __GLIBCXX__ >= 20150123L
  C stack_resident;
  ASSERT_THROW(stack_resident.shared_from_this(), std::bad_weak_ptr);
  ASSERT_TRUE(stack_resident.weak_from_this().expired());
#endif
}

TEST(enable_shared_from_this, compatible_with_std_enable_shared_from_this) {
  // Compile-time compatibility.
  class C_std : public std::enable_shared_from_this<C_std> {};
  class C_folly : public folly::enable_shared_from_this<C_folly> {};
  static_assert(
    noexcept(std::declval<C_std>().shared_from_this()) ==
    noexcept(std::declval<C_folly>().shared_from_this()), "");
  static_assert(
    noexcept(std::declval<C_std const>().shared_from_this()) ==
    noexcept(std::declval<C_folly const>().shared_from_this()), "");
  static_assert(noexcept(std::declval<C_folly>().weak_from_this()), "");
  static_assert(noexcept(std::declval<C_folly const>().weak_from_this()), "");

  // Runtime compatibility.
  test_enable_shared_from_this(std::make_shared<C_folly>());
  test_enable_shared_from_this(std::make_shared<C_folly const>());
}
