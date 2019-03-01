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
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

#include <folly/io/async/EventBaseLocal.h>
#include <folly/portability/GTest.h>

struct Foo {
  Foo(int n, std::function<void()> dtorFn):
    n(n), dtorFn(std::move(dtorFn)) {}
  ~Foo() { dtorFn(); }

  int n;
  std::function<void()> dtorFn;
};

TEST(EventBaseLocalTest, Basic) {
  int dtorCnt = 0;
  folly::EventBase evb1;

  {
    folly::EventBaseLocal<Foo> foo;

    EXPECT_EQ(foo.get(evb1), nullptr);

    foo.emplace(evb1, new Foo(5, [&] () { ++dtorCnt; }));

    EXPECT_EQ(foo.get(evb1)->n, 5);

    {
      folly::EventBase evb2;
      foo.emplace(evb2, new Foo(6, [&] () { ++dtorCnt; }));
      EXPECT_EQ(foo.get(evb2)->n, 6);
      foo.erase(evb2);
      EXPECT_EQ(dtorCnt, 1); // should dtor a Foo when we erase
      EXPECT_EQ(foo.get(evb2), nullptr);
      foo.emplace(evb2, 7, [&] () { ++dtorCnt; });
      EXPECT_EQ(foo.get(evb2)->n, 7);
    }

    EXPECT_EQ(dtorCnt, 2); // should dtor a Foo when evb2 destructs

  }
  EXPECT_EQ(dtorCnt, 3); // should dtor a Foo when foo destructs
}

TEST(EventBaseLocalTest, getOrCreate) {
  folly::EventBase evb1;
  folly::EventBaseLocal<int> ints;

  EXPECT_EQ(ints.getOrCreate(evb1), 0);
  EXPECT_EQ(ints.getOrCreate(evb1, 5), 0);

  folly::EventBase evb2;
  EXPECT_EQ(ints.getOrCreate(evb2, 5), 5);
  ints.erase(evb2);
  auto creator = []() { return new int(4); };
  EXPECT_EQ(ints.getOrCreateFn(evb2, creator), 4);
}
