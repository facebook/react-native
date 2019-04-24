/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/io/async/DelayedDestructionBase.h>

#include <functional>

#include <folly/portability/GTest.h>

using namespace folly;

class DestructionOnCallback : public DelayedDestructionBase {
 public:
  DestructionOnCallback() : state_(0), deleted_(false) {}

  void onComplete(int n, int& state) {
    DestructorGuard dg(this);
    for (auto i = n; i >= 0; --i) {
      onStackedComplete(i);
    }
    state = state_;
  }

  int state() const {
    return state_;
  }
  bool deleted() const {
    return deleted_;
  }

 protected:
  void onStackedComplete(int recur) {
    DestructorGuard dg(this);
    ++state_;
    if (recur <= 0) {
      return;
    }
    onStackedComplete(--recur);
  }

 private:
  int state_;
  bool deleted_;

  void onDelayedDestroy(bool delayed) override {
    deleted_ = true;
    delete this;
    (void)delayed; // prevent unused variable warnings
  }
};

struct DelayedDestructionBaseTest : public ::testing::Test {};

TEST_F(DelayedDestructionBaseTest, basic) {
  DestructionOnCallback* d = new DestructionOnCallback();
  EXPECT_NE(d, nullptr);
  int32_t state;
  d->onComplete(3, state);
  EXPECT_EQ(state, 10); // 10 = 6 + 3 + 1
}
