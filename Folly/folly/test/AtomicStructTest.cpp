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

#include <folly/AtomicStruct.h>

#include <folly/portability/GTest.h>

using namespace folly;

struct TwoBy32 {
  uint32_t left;
  uint32_t right;
};

TEST(AtomicStruct, two_by_32) {
  AtomicStruct<TwoBy32> a(TwoBy32{ 10, 20 });
  TwoBy32 av = a;
  EXPECT_EQ(av.left, 10);
  EXPECT_EQ(av.right, 20);
  EXPECT_TRUE(a.compare_exchange_strong(av, TwoBy32{ 30, 40 }));
  EXPECT_FALSE(a.compare_exchange_weak(av, TwoBy32{ 31, 41 }));
  EXPECT_EQ(av.left, 30);
  EXPECT_TRUE(a.is_lock_free());
  auto b = a.exchange(TwoBy32{ 50, 60 });
  EXPECT_EQ(b.left, 30);
  EXPECT_EQ(b.right, 40);
  EXPECT_EQ(a.load().left, 50);
  a = TwoBy32{ 70, 80 };
  EXPECT_EQ(a.load().right, 80);
  a.store(TwoBy32{ 90, 100 });
  av = a;
  EXPECT_EQ(av.left, 90);
  AtomicStruct<TwoBy32> c;
  c = b;
  EXPECT_EQ(c.load().right, 40);
}

TEST(AtomicStruct, size_selection) {
  struct S1 { char x[1]; };
  struct S2 { char x[2]; };
  struct S3 { char x[3]; };
  struct S4 { char x[4]; };
  struct S5 { char x[5]; };
  struct S6 { char x[6]; };
  struct S7 { char x[7]; };
  struct S8 { char x[8]; };

  EXPECT_EQ(sizeof(AtomicStruct<S1>), 1);
  EXPECT_EQ(sizeof(AtomicStruct<S2>), 2);
  EXPECT_EQ(sizeof(AtomicStruct<S3>), 4);
  EXPECT_EQ(sizeof(AtomicStruct<S4>), 4);
  EXPECT_EQ(sizeof(AtomicStruct<S5>), 8);
  EXPECT_EQ(sizeof(AtomicStruct<S6>), 8);
  EXPECT_EQ(sizeof(AtomicStruct<S7>), 8);
  EXPECT_EQ(sizeof(AtomicStruct<S8>), 8);
}
