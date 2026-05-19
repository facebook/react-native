/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "UniquePtrFactory.h"

using namespace ::testing;

namespace {

struct Foo {
  explicit Foo(int v) : value(v) {}

  // Required for UniquePtrFactory
  virtual ~Foo() = default;

  int value{0};
};

} // namespace

namespace facebook {

TEST(UniquePtrFactoryTest, KitchenSink) {
  UniquePtrFactory<Foo> fooObjects;

  EXPECT_EQ(fooObjects[0], nullptr)
      << "objects should be nullptr before being created";
  EXPECT_EQ(fooObjects.objectsVended(), 0);

  auto foo0 = fooObjects.make_unique(100);
  EXPECT_EQ(foo0.get(), fooObjects[0]);
  EXPECT_EQ(fooObjects.objectsVended(), 1);

  auto foo1 = fooObjects.make_unique(200);
  EXPECT_EQ(foo1.get(), fooObjects[1]);
  EXPECT_EQ(fooObjects.objectsVended(), 2);

  foo0.reset();
  EXPECT_EQ(fooObjects[0], nullptr)
      << "objects should be nullptr after being destroyed";
  EXPECT_EQ(fooObjects.objectsVended(), 2)
      << "objectsVended should never decrease";
  EXPECT_EQ(foo1.get(), fooObjects[1])
      << "foo1 should not be affected by foo0 being reset";

  foo1.reset();
  EXPECT_EQ(fooObjects[1], nullptr)
      << "objects should be nullptr after being destroyed";
  EXPECT_EQ(fooObjects.objectsVended(), 2);

  auto foo2 = fooObjects.make_unique(300);
  EXPECT_EQ(foo2.get(), fooObjects[2]);
  EXPECT_EQ(fooObjects.objectsVended(), 3);
}

TEST(UniquePtrFactoryTest, LazilyMakeUnique) {
  UniquePtrFactory<Foo> fooObjects;

  EXPECT_EQ(fooObjects[0], nullptr)
      << "objects should be nullptr before being created";
  EXPECT_EQ(fooObjects.objectsVended(), 0);

  auto makeFoo = fooObjects.lazily_make_unique<int>();

  EXPECT_EQ(fooObjects[0], nullptr)
      << "an object should not be created until makeFoo is called";
  EXPECT_EQ(fooObjects.objectsVended(), 0);

  auto foo0 = makeFoo(100);
  EXPECT_EQ(foo0.get(), fooObjects[0]);
  EXPECT_EQ(fooObjects.objectsVended(), 1);

  auto foo1 = makeFoo(200);
  EXPECT_EQ(foo1.get(), fooObjects[1]);
  EXPECT_EQ(fooObjects.objectsVended(), 2);
}

} // namespace facebook
