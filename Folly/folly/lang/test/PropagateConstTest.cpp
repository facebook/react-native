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

#include <folly/lang/PropagateConst.h>

#include <memory>

#include <folly/portability/GTest.h>

using namespace folly;

class PropagateConstTest : public testing::Test {};

//  force complete template instantiations
template class folly::propagate_const<int*>;
template class folly::propagate_const<std::unique_ptr<int>>;
template class folly::propagate_const<std::shared_ptr<int>>;

template <typename T>
static bool is_const(T&&) {
  return std::is_const<_t<std::remove_reference<T>>>::value;
}

template <typename T>
using pc = propagate_const<T>;

TEST_F(PropagateConstTest, construct_assign) {
  struct Source {
    int& operator*();
    int* get();
  };
  struct Implicit {
    int& operator*();
    int* get();
    /* implicit */ Implicit(Source) {}
  };
  struct Explicit {
    int& operator*();
    int* get();
    explicit Explicit(Source) {}
  };

  EXPECT_TRUE((std::is_constructible<pc<Implicit>, Source>::value));
  EXPECT_TRUE((std::is_constructible<pc<Explicit>, Source>::value));
  EXPECT_TRUE((std::is_convertible<Source, pc<Implicit>>::value));
  EXPECT_FALSE((std::is_convertible<Source, pc<Explicit>>::value));
  EXPECT_TRUE((std::is_assignable<pc<Implicit>, Source>::value));
  EXPECT_FALSE((std::is_assignable<pc<Explicit>, Source>::value));

  EXPECT_TRUE((std::is_constructible<pc<Implicit>, pc<Source>>::value));
  EXPECT_TRUE((std::is_constructible<pc<Explicit>, pc<Source>>::value));
  EXPECT_TRUE((std::is_convertible<pc<Source>, pc<Implicit>>::value));
  EXPECT_FALSE((std::is_convertible<pc<Source>, pc<Explicit>>::value));
  EXPECT_TRUE((std::is_assignable<pc<Implicit>, pc<Source>>::value));
  EXPECT_FALSE((std::is_assignable<pc<Explicit>, pc<Source>>::value));
}

TEST_F(PropagateConstTest, op_assign_move) {
  auto ptr = pc<std::unique_ptr<int>>{std::make_unique<int>(1)};
  EXPECT_EQ(*ptr, 1);

  ptr = std::make_unique<int>(2);
  EXPECT_EQ(*ptr, 2);
}

TEST_F(PropagateConstTest, get) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);

  EXPECT_EQ(a, pc_a.get());
  EXPECT_EQ(a, as_const(pc_a).get());
  EXPECT_FALSE(is_const(*pc_a.get()));
  EXPECT_TRUE(is_const(*as_const(pc_a).get()));
}

TEST_F(PropagateConstTest, op_indirect) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);

  EXPECT_EQ(a, &*pc_a);
  EXPECT_EQ(a, &*as_const(pc_a));
  EXPECT_FALSE(is_const(*pc_a));
  EXPECT_TRUE(is_const(*as_const(pc_a)));
}

TEST_F(PropagateConstTest, op_element_type_ptr) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);

  EXPECT_EQ(a, static_cast<int*>(pc_a));
  EXPECT_EQ(a, static_cast<int const*>(as_const(pc_a)));
}

TEST_F(PropagateConstTest, op_bool) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);
  auto pc_0 = pc<int*>(nullptr);

  EXPECT_TRUE(pc_a);
  EXPECT_FALSE(pc_0);
}

TEST_F(PropagateConstTest, get_underlying) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);

  EXPECT_EQ(a, get_underlying(pc_a));
  EXPECT_EQ(a, get_underlying(as_const(pc_a)));
  EXPECT_FALSE(is_const(get_underlying(pc_a)));
  EXPECT_TRUE(is_const(get_underlying(as_const(pc_a))));
  EXPECT_TRUE(&get_underlying(pc_a) == &get_underlying(as_const(pc_a)));
}

TEST_F(PropagateConstTest, swap) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  swap(pc_a, pc_b);
  EXPECT_EQ(3, *pc_b);
  EXPECT_EQ(4, *pc_a);

  swap(pc_a, pc_b);
  EXPECT_EQ(3, *pc_a);
  EXPECT_EQ(4, *pc_b);
}

TEST_F(PropagateConstTest, op_equal_to) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x == y; };
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
  EXPECT_FALSE(_(pc_a, nullptr));
  EXPECT_TRUE(_(pc_a, a));
  EXPECT_FALSE(_(pc_a, b));
  EXPECT_TRUE(_(a, pc_a));
  EXPECT_FALSE(_(b, pc_a));
}

TEST_F(PropagateConstTest, op_not_equal_to) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x != y; };
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
  EXPECT_TRUE(_(pc_a, nullptr));
  EXPECT_FALSE(_(pc_a, a));
  EXPECT_TRUE(_(pc_a, b));
  EXPECT_FALSE(_(a, pc_a));
  EXPECT_TRUE(_(b, pc_a));
}

TEST_F(PropagateConstTest, op_less) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x < y; };
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, a));
  EXPECT_FALSE(_(a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
  EXPECT_TRUE(_(pc_a, b));
  EXPECT_TRUE(_(a, pc_b));
  EXPECT_FALSE(_(pc_b, pc_a));
  EXPECT_FALSE(_(pc_b, a));
  EXPECT_FALSE(_(b, pc_a));
  EXPECT_FALSE(_(pc_b, pc_b));
  EXPECT_FALSE(_(pc_b, b));
  EXPECT_FALSE(_(b, pc_b));
}

TEST_F(PropagateConstTest, op_greater) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x > y; };
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, a));
  EXPECT_FALSE(_(a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
  EXPECT_FALSE(_(pc_a, b));
  EXPECT_FALSE(_(a, pc_b));
  EXPECT_TRUE(_(pc_b, pc_a));
  EXPECT_TRUE(_(pc_b, a));
  EXPECT_TRUE(_(b, pc_a));
  EXPECT_FALSE(_(pc_b, pc_b));
  EXPECT_FALSE(_(pc_b, b));
  EXPECT_FALSE(_(b, pc_b));
}

TEST_F(PropagateConstTest, op_less_equal) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x <= y; };
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, a));
  EXPECT_TRUE(_(a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
  EXPECT_TRUE(_(pc_a, b));
  EXPECT_TRUE(_(a, pc_b));
  EXPECT_FALSE(_(pc_b, pc_a));
  EXPECT_FALSE(_(pc_b, a));
  EXPECT_FALSE(_(b, pc_a));
  EXPECT_TRUE(_(pc_b, pc_b));
  EXPECT_TRUE(_(pc_b, b));
  EXPECT_TRUE(_(b, pc_b));
}

TEST_F(PropagateConstTest, op_greater_equal) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = [](auto&& x, auto&& y) { return x >= y; };
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, a));
  EXPECT_TRUE(_(a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
  EXPECT_FALSE(_(pc_a, b));
  EXPECT_FALSE(_(a, pc_b));
  EXPECT_TRUE(_(pc_b, pc_a));
  EXPECT_TRUE(_(pc_b, a));
  EXPECT_TRUE(_(b, pc_a));
  EXPECT_TRUE(_(pc_b, pc_b));
  EXPECT_TRUE(_(pc_b, b));
  EXPECT_TRUE(_(b, pc_b));
}

TEST_F(PropagateConstTest, hash) {
  int data[1] = {3};
  auto a = data + 0;
  auto pc_a = pc<int*>(a);

  EXPECT_EQ(std::hash<int*>()(a), std::hash<pc<int*>>()(pc_a));
}

TEST_F(PropagateConstTest, equal_to) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::equal_to<pc<int*>>{};
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
}

TEST_F(PropagateConstTest, not_equal_to) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::not_equal_to<pc<int*>>{};
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
}

TEST_F(PropagateConstTest, less) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::less<pc<int*>>{};
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
  EXPECT_FALSE(_(pc_b, pc_a));
  EXPECT_FALSE(_(pc_b, pc_b));
}

TEST_F(PropagateConstTest, greater) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::greater<pc<int*>>{};
  EXPECT_FALSE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
  EXPECT_TRUE(_(pc_b, pc_a));
  EXPECT_FALSE(_(pc_b, pc_b));
}

TEST_F(PropagateConstTest, less_equal) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::less_equal<pc<int*>>{};
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_TRUE(_(pc_a, pc_b));
  EXPECT_FALSE(_(pc_b, pc_a));
  EXPECT_TRUE(_(pc_b, pc_b));
}

TEST_F(PropagateConstTest, greater_equal) {
  int data[2] = {3, 4};
  auto a = data + 0;
  auto b = data + 1;
  auto pc_a = pc<int*>(a);
  auto pc_b = pc<int*>(b);

  auto _ = std::greater_equal<pc<int*>>{};
  EXPECT_TRUE(_(pc_a, pc_a));
  EXPECT_FALSE(_(pc_a, pc_b));
  EXPECT_TRUE(_(pc_b, pc_a));
  EXPECT_TRUE(_(pc_b, pc_b));
}
