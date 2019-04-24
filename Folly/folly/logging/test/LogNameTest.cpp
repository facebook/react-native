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
#include <folly/logging/LogName.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(LogName, canonicalize) {
  EXPECT_EQ("", LogName::canonicalize("."));
  EXPECT_EQ("", LogName::canonicalize("..."));
  EXPECT_EQ("", LogName::canonicalize("/"));
  EXPECT_EQ("", LogName::canonicalize("\\"));
  EXPECT_EQ("", LogName::canonicalize(".//..\\\\./"));
  EXPECT_EQ("foo.bar", LogName::canonicalize(".foo..bar."));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a.b.c"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a/b/c"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a/b/c/"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a..b.c..."));
  EXPECT_EQ("a.b.c", LogName::canonicalize("....a.b.c"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a.b.c...."));
  EXPECT_EQ("a.b.c", LogName::canonicalize("////a.b.c"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("a.b.c////"));
  EXPECT_EQ("a.b.c", LogName::canonicalize("/a.b.//.c/"));
}

TEST(LogName, getParent) {
  EXPECT_EQ("", LogName::getParent("foo"));
  EXPECT_EQ("", LogName::getParent(".foo"));
  EXPECT_EQ("foo", LogName::getParent("foo.bar"));
  EXPECT_EQ("foo", LogName::getParent("foo/bar"));
  EXPECT_EQ("foo", LogName::getParent("foo\\bar"));
  EXPECT_EQ("foo", LogName::getParent("foo\\bar/"));
  EXPECT_EQ("foo", LogName::getParent("foo\\bar\\"));
  EXPECT_EQ("foo..bar", LogName::getParent("foo..bar..test"));
  EXPECT_EQ("..foo..bar", LogName::getParent("..foo..bar..test.."));
}

TEST(LogName, hash) {
  EXPECT_EQ(LogName::hash("foo"), LogName::hash("foo."));
  EXPECT_EQ(LogName::hash(".foo..bar"), LogName::hash("foo.bar..."));
  EXPECT_EQ(LogName::hash("a.b.c..d."), LogName::hash("..a.b.c.d."));
  EXPECT_EQ(LogName::hash("a.b.c.d"), LogName::hash("/a/b/c/d/"));
  EXPECT_EQ(LogName::hash("a.b.c.d"), LogName::hash("a\\b\\c/d/"));
  EXPECT_EQ(LogName::hash(""), LogName::hash("."));
  EXPECT_EQ(LogName::hash(""), LogName::hash("//"));
  EXPECT_EQ(LogName::hash(""), LogName::hash("\\"));
  EXPECT_EQ(LogName::hash(""), LogName::hash("...."));

  // Hashes for different category names should generally be different.
  // This is not strictly required.  This test is mainly to ensure that the
  // code does not just hash all inputs to the same value.
  EXPECT_NE(LogName::hash("foo"), LogName::hash("bar"));
  EXPECT_NE(LogName::hash("a.b.c"), LogName::hash("abc"));
}

TEST(LogName, cmp) {
  EXPECT_EQ(0, LogName::cmp("foo", "foo."));
  EXPECT_EQ(0, LogName::cmp("foo", "foo/"));
  EXPECT_EQ(0, LogName::cmp(".foo..bar", "foo.bar..."));
  EXPECT_EQ(0, LogName::cmp(".foo.bar", "foo...bar..."));
  EXPECT_EQ(0, LogName::cmp("a.b.c..d.", "..a.b.c.d."));
  EXPECT_EQ(0, LogName::cmp("a.b.c..d.", "\\/a.b/c/d."));
  EXPECT_EQ(0, LogName::cmp("", "."));
  EXPECT_EQ(0, LogName::cmp("", "...."));

  EXPECT_GT(LogName::cmp("foo", "bar"), 0);
  EXPECT_LT(LogName::cmp("a.b.c", "abc"), 0);
  EXPECT_LT(LogName::cmp("a...b.c", "a.bc"), 0);
  EXPECT_GT(LogName::cmp("a...b.z", "a.b.c"), 0);
  EXPECT_LT(LogName::cmp(".foo.bar", "foobar..."), 0);
  EXPECT_GT(LogName::cmp("foobar", ".foo...bar"), 0);
}
