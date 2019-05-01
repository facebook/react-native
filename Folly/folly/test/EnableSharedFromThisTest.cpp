/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/memory/EnableSharedFromThis.h>
#include <folly/portability/GTest.h>

using namespace folly;

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
#if __cplusplus >= 201700L || __GLIBCXX__ >= 20150123L
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
          noexcept(std::declval<C_folly>().shared_from_this()),
      "");
  static_assert(
      noexcept(std::declval<C_std const>().shared_from_this()) ==
          noexcept(std::declval<C_folly const>().shared_from_this()),
      "");
  static_assert(noexcept(std::declval<C_folly>().weak_from_this()), "");
  static_assert(noexcept(std::declval<C_folly const>().weak_from_this()), "");

  // Runtime compatibility.
  test_enable_shared_from_this(std::make_shared<C_folly>());
  test_enable_shared_from_this(std::make_shared<C_folly const>());
}
