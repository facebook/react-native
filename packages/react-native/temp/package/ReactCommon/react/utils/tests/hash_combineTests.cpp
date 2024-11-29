/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <react/utils/hash_combine.h>

struct Person {
  std::string firstName;
  std::string lastName;
};

namespace std {
template <>
struct hash<Person> {
  size_t operator()(const Person& person) const {
    return facebook::react::hash_combine(person.firstName, person.lastName);
  }
};
} // namespace std

namespace facebook::react {

TEST(hash_combineTests, testIntegerTemplating) {
  std::size_t seed = 0;
  hash_combine(seed, 1);

  auto hashedValue = hash_combine(1);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(1), hash_combine(2));
}

TEST(hash_combineTests, testIntegerCombinationsHashing) {
  std::size_t seed = 0;
  hash_combine(seed, 1, 2);

  auto hashedValue = hash_combine(1, 2);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(1, 2), hash_combine(2, 1));
}

TEST(hash_combineTests, testContiniousIntegerHashing) {
  std::size_t seed = 0;

  for (int i = 1; i <= 200; ++i) {
    auto previousSeed = seed;
    hash_combine(seed, i);
    EXPECT_NE(seed, previousSeed);
  }
}

TEST(hash_combineTests, testStrings) {
  std::size_t seed = 0;
  hash_combine<std::string>(seed, "react");

  auto hashedValue = hash_combine<std::string>("react");
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(
      hash_combine<std::string>("react"),
      hash_combine<std::string>("react native"));
}

TEST(hash_combineTests, testCustomTypes) {
  auto person1 = Person{"John", "Doe"};
  auto person2 = Person{"Jane", "Doe"};

  std::size_t seed = 0;
  hash_combine(seed, person1);

  auto hashedValue = hash_combine(person1);
  EXPECT_EQ(hashedValue, seed);

  EXPECT_NE(hash_combine(person1), hash_combine(person2));
}

} // namespace facebook::react
