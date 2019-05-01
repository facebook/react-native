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
#include <folly/Overload.h>
#include <boost/variant.hpp>
#include <folly/DiscriminatedPtr.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace test {

struct One {
  std::string toString() const {
    return "One";
  }
};
struct Two {
  std::string toString() const {
    return "Two";
  }
};
using OneOrTwo = boost::variant<One, Two>;

TEST(Overload, BoostVariant) {
  OneOrTwo one(One{});
  OneOrTwo two(Two{});

  EXPECT_TRUE(variant_match(
      one, [](const One&) { return true; }, [](const Two&) { return false; }));
  EXPECT_TRUE(variant_match(
      two, [](const One&) { return false; }, [](const Two&) { return true; }));

  auto toString = [](const auto& variant) {
    return variant_match(
        variant, [](const auto& value) { return value.toString(); });
  };
  EXPECT_EQ(toString(one), "One");
  EXPECT_EQ(toString(two), "Two");
}

TEST(Overload, DiscriminatedPtr) {
  using V = DiscriminatedPtr<One, Two>;
  One one_obj;
  Two two_obj;
  V one_ptr(&one_obj);
  V two_ptr(&two_obj);

  EXPECT_TRUE(variant_match(
      one_ptr,
      [](const One*) { return true; },
      [](const Two*) { return false; }));
  EXPECT_TRUE(variant_match(
      two_ptr,
      [](const One*) { return false; },
      [](const Two*) { return true; }));

  auto toString = [](const auto& variant) {
    return variant_match(
        variant, [](const auto* value) { return value->toString(); });
  };
  EXPECT_EQ(toString(one_ptr), "One");
  EXPECT_EQ(toString(two_ptr), "Two");
}

TEST(Overload, Pattern) {
  OneOrTwo one(One{});
  OneOrTwo two(Two{});

  auto is_one_overload = overload(
      [](const One&) { return true; }, [](const Two&) { return false; });
  EXPECT_TRUE(boost::apply_visitor(is_one_overload, one));
  EXPECT_TRUE(variant_match(one, is_one_overload));
  EXPECT_FALSE(variant_match(two, is_one_overload));

  auto is_two_overload = overload(
      [](const One&) { return false; }, [](const Two&) { return true; });
  EXPECT_TRUE(boost::apply_visitor(is_two_overload, two));
  EXPECT_FALSE(variant_match(one, is_two_overload));
  EXPECT_TRUE(variant_match(two, is_two_overload));

  auto is_one_copy = overload(is_one_overload);
  auto is_one_const_copy =
      overload(static_cast<const decltype(is_one_overload)&>(is_one_overload));
  EXPECT_TRUE(variant_match(one, is_one_copy));
  EXPECT_TRUE(variant_match(one, is_one_const_copy));
  EXPECT_FALSE(variant_match(two, is_one_copy));
  EXPECT_FALSE(variant_match(two, is_one_const_copy));
}
} // namespace test
} // namespace folly
