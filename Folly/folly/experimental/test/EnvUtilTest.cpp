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

#include <folly/experimental/EnvUtil.h>

#include <system_error>

#include <boost/algorithm/string.hpp>
#include <glog/logging.h>

#include <folly/Memory.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/GTest.h>
#include <folly/portability/Stdlib.h>

using namespace folly;
using namespace folly::test;

class EnvVarSaverTest : public testing::Test {};

TEST_F(EnvVarSaverTest, ExampleNew) {
  auto key = "hahahahaha";
  EXPECT_EQ(nullptr, getenv(key));

  PCHECK(0 == setenv(key, "", true));
  EXPECT_STREQ("", getenv(key));
  PCHECK(0 == unsetenv(key));
  EXPECT_EQ(nullptr, getenv(key));

  auto saver = make_unique<EnvVarSaver>();
  PCHECK(0 == setenv(key, "blah", true));
  EXPECT_EQ("blah", std::string{getenv(key)});
  saver = nullptr;
  EXPECT_EQ(nullptr, getenv(key));
}

TEST_F(EnvVarSaverTest, ExampleExisting) {
  auto key = "PATH";
  EXPECT_NE(nullptr, getenv(key));
  auto value = std::string{getenv(key)};

  auto saver = make_unique<EnvVarSaver>();
  PCHECK(0 == setenv(key, "blah", true));
  EXPECT_EQ("blah", std::string{getenv(key)});
  saver = nullptr;
  EXPECT_TRUE(value == getenv(key));
}

TEST_F(EnvVarSaverTest, ExampleDeleting) {
  auto key = "PATH";
  EXPECT_NE(nullptr, getenv(key));
  auto value = std::string{getenv(key)};

  auto saver = make_unique<EnvVarSaver>();
  PCHECK(0 == unsetenv(key));
  EXPECT_EQ(nullptr, getenv(key));
  saver = nullptr;
  EXPECT_TRUE(value == getenv(key));
}
