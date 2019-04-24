/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/Portability.h>
#include <folly/container/F14Set.h>
#include <folly/portability/GTest.h>

using namespace folly;

template <typename S>
void useIteratorAfterInsertSmall() {
  S set;
  auto iter = set.insert(1).first;
  set.insert(2);
  EXPECT_EQ(*iter, 1);
}

template <typename S>
void useIteratorAfterInsertLarge() {
  S set;
  set.insert(10);
  for (int i = 0; i < 1000; ++i) {
    auto iter = set.find(10);
    set.insert(i);
    if (i > 500) {
      EXPECT_EQ(*iter, 10);
    }
  }
}

template <typename S>
void useReferenceAfterInsertSmall() {
  S set;
  auto& ref = *set.insert(1).first;
  set.insert(2);
  EXPECT_EQ(ref, 1);
}

template <typename S>
void useReferenceAfterInsertLarge() {
  S set;
  set.insert(10);
  for (int i = 0; i < 1000; ++i) {
    auto& ref = *set.find(10);
    set.insert(i);
    if (i > 500) {
      EXPECT_EQ(ref, 10);
    }
  }
}

template <typename F>
void repeat(F const& func) {
  for (int i = 0; i < 32; ++i) {
    func();
  }
}

template <typename F>
void expectAsanFailure(F const& func) {
  if (kIsSanitizeAddress) {
    EXPECT_EXIT(
        repeat(func), testing::ExitedWithCode(1), ".*heap-use-after-free.*");
  }
}

TEST(F14AsanSupportTest, F14ValueIterInsertSmall) {
  expectAsanFailure(useIteratorAfterInsertSmall<F14ValueSet<int>>);
}
TEST(F14AsanSupportTest, F14NodeIterInsertSmall) {
  expectAsanFailure(useIteratorAfterInsertSmall<F14NodeSet<int>>);
}
TEST(F14AsanSupportTest, F14VectorIterInsertSmall) {
  expectAsanFailure(useIteratorAfterInsertSmall<F14VectorSet<int>>);
}
TEST(F14AsanSupportTest, F14FastIterInsertSmall) {
  expectAsanFailure(useIteratorAfterInsertSmall<F14FastSet<int>>);
}

TEST(F14AsanSupportTest, F14ValueIterInsertLarge) {
  expectAsanFailure(useIteratorAfterInsertLarge<F14ValueSet<int>>);
}
TEST(F14AsanSupportTest, F14NodeIterInsertLarge) {
  expectAsanFailure(useIteratorAfterInsertLarge<F14NodeSet<int>>);
}
TEST(F14AsanSupportTest, F14VectorIterInsertLarge) {
  expectAsanFailure(useIteratorAfterInsertLarge<F14VectorSet<int>>);
}
TEST(F14AsanSupportTest, F14FastIterInsertLarge) {
  expectAsanFailure(useIteratorAfterInsertLarge<F14FastSet<int>>);
}

TEST(F14AsanSupportTest, F14ValueRefInsertSmall) {
  expectAsanFailure(useReferenceAfterInsertSmall<F14ValueSet<int>>);
}
TEST(F14AsanSupportTest, F14VectorRefInsertSmall) {
  expectAsanFailure(useReferenceAfterInsertSmall<F14VectorSet<int>>);
}
TEST(F14AsanSupportTest, F14FastRefInsertSmall) {
  expectAsanFailure(useReferenceAfterInsertSmall<F14FastSet<int>>);
}

TEST(F14AsanSupportTest, F14ValueRefInsertLarge) {
  expectAsanFailure(useReferenceAfterInsertLarge<F14ValueSet<int>>);
}
TEST(F14AsanSupportTest, F14VectorRefInsertLarge) {
  expectAsanFailure(useReferenceAfterInsertLarge<F14VectorSet<int>>);
}
TEST(F14AsanSupportTest, F14FastRefInsertLarge) {
  expectAsanFailure(useReferenceAfterInsertLarge<F14FastSet<int>>);
}

TEST(F14AsanSupportTest, F14VectorErase) {
  F14VectorSet<int> set;
  set.insert(1);
  set.insert(2);
  set.insert(3);
  auto& v = *set.begin();
  EXPECT_EQ(v, 3);
  set.erase(2);
  if (kIsSanitizeAddress) {
    EXPECT_NE(v, 3);
  }
}
