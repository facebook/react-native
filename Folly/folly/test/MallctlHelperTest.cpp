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

#include <folly/MallctlHelper.h>
#include <folly/Malloc.h>
#include <folly/init/Init.h>
#include <folly/portability/GTest.h>

using namespace folly;

const char* malloc_conf = "purge:decay,decay_time:10";

class MallctlHelperTest : public ::testing::Test {
 protected:
  void TearDown() override {
    // Reset decay_time of arena 0 to 10 seconds.
    ssize_t decayTime = 10;
    EXPECT_NO_THROW(mallctlWrite("arena.0.decay_time", decayTime));
  }

  static ssize_t readArena0DecayTime() {
    ssize_t decayTime = 0;
    EXPECT_NO_THROW(mallctlRead("arena.0.decay_time", &decayTime));
    return decayTime;
  }
};

TEST_F(MallctlHelperTest, valid_read) {
  ssize_t decayTime = 0;
  EXPECT_NO_THROW(mallctlRead("opt.decay_time", &decayTime));
  EXPECT_EQ(10, decayTime);
}

TEST_F(MallctlHelperTest, invalid_read) {
  ssize_t decayTime = 0;
  EXPECT_THROW(mallctlRead("invalid", &decayTime), std::runtime_error);
  EXPECT_EQ(0, decayTime);
}

TEST_F(MallctlHelperTest, valid_write) {
  ssize_t decayTime = 20;
  EXPECT_NO_THROW(mallctlWrite("arena.0.decay_time", decayTime));
  EXPECT_EQ(20, readArena0DecayTime());
}

TEST_F(MallctlHelperTest, invalid_write) {
  ssize_t decayTime = 20;
  EXPECT_THROW(mallctlWrite("invalid", decayTime), std::runtime_error);
  EXPECT_EQ(10, readArena0DecayTime());
}

TEST_F(MallctlHelperTest, valid_read_write) {
  ssize_t oldDecayTime = 0;
  ssize_t newDecayTime = 20;
  EXPECT_NO_THROW(
      mallctlReadWrite("arena.0.decay_time", &oldDecayTime, newDecayTime));
  EXPECT_EQ(10, oldDecayTime);
  EXPECT_EQ(20, readArena0DecayTime());
}

TEST_F(MallctlHelperTest, invalid_read_write) {
  ssize_t oldDecayTime = 0;
  ssize_t newDecayTime = 20;
  EXPECT_THROW(
      mallctlReadWrite("invalid", &oldDecayTime, newDecayTime),
      std::runtime_error);
  EXPECT_EQ(0, oldDecayTime);
  EXPECT_EQ(10, readArena0DecayTime());
}

TEST_F(MallctlHelperTest, valid_call) {
  EXPECT_NO_THROW(mallctlCall("arena.0.decay"));
}

TEST_F(MallctlHelperTest, invalid_call) {
  EXPECT_THROW(mallctlCall("invalid"), std::runtime_error);
}

int main(int argc, char** argv) {
  ::testing::InitGoogleTest(&argc, argv);
  init(&argc, &argv);
  return usingJEMalloc() ? RUN_ALL_TESTS() : 0;
}
