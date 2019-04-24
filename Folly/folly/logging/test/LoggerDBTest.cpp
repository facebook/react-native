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
#include <folly/logging/LoggerDB.h>

#include <folly/logging/Logger.h>
#include <folly/logging/test/TestLogHandler.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(LoggerDB, lookupNameCanonicalization) {
  LoggerDB db{LoggerDB::TESTING};
  Logger foo{&db, "foo"};
  Logger foo2{&db, "..foo.."};
  EXPECT_EQ(foo.getCategory(), foo2.getCategory());

  Logger fooBar{&db, "foo.bar"};
  Logger fooBar2{&db, ".foo..bar"};
  EXPECT_EQ(fooBar.getCategory(), fooBar2.getCategory());
}

TEST(LoggerDB, getCategory) {
  LoggerDB db{LoggerDB::TESTING};
}

TEST(LoggerDB, flushAllHandlers) {
  LoggerDB db{LoggerDB::TESTING};
  auto* cat1 = db.getCategory("foo");
  auto* cat2 = db.getCategory("foo.bar.test");
  auto* cat3 = db.getCategory("hello.world");
  auto* cat4 = db.getCategory("other.category");

  auto h1 = std::make_shared<TestLogHandler>();
  auto h2 = std::make_shared<TestLogHandler>();
  auto h3 = std::make_shared<TestLogHandler>();

  cat1->addHandler(h1);

  cat2->addHandler(h2);
  cat2->addHandler(h3);

  cat3->addHandler(h1);
  cat3->addHandler(h2);
  cat3->addHandler(h3);

  cat4->addHandler(h1);

  EXPECT_EQ(0, h1->getFlushCount());
  EXPECT_EQ(0, h2->getFlushCount());
  EXPECT_EQ(0, h3->getFlushCount());

  // Calling flushAllHandlers() should only flush each handler once,
  // even when they are attached to multiple categories.
  db.flushAllHandlers();
  EXPECT_EQ(1, h1->getFlushCount());
  EXPECT_EQ(1, h2->getFlushCount());
  EXPECT_EQ(1, h3->getFlushCount());

  db.flushAllHandlers();
  EXPECT_EQ(2, h1->getFlushCount());
  EXPECT_EQ(2, h2->getFlushCount());
  EXPECT_EQ(2, h3->getFlushCount());
}
