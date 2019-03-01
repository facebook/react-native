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

#include <folly/futures/detail/FSM.h>
#include <folly/portability/GTest.h>

using namespace folly::detail;

enum class State { A, B };

TEST(FSM, example) {
  FSM<State> fsm(State::A);
  int count = 0;
  int unprotectedCount = 0;

  // somebody set up us the switch
  auto tryTransition = [&]{
    switch (fsm.getState()) {
    case State::A:
      return fsm.updateState(State::A, State::B, [&]{ count++; });
    case State::B:
      return fsm.updateState(State::B, State::A,
                             [&]{ count--; }, [&]{ unprotectedCount--; });
    }
    return false; // unreachable
  };

  // keep retrying until success (like a cas)
  while (!tryTransition()) ;
  EXPECT_EQ(State::B, fsm.getState());
  EXPECT_EQ(1, count);
  EXPECT_EQ(0, unprotectedCount);

  while (!tryTransition()) ;
  EXPECT_EQ(State::A, fsm.getState());
  EXPECT_EQ(0, count);
  EXPECT_EQ(-1, unprotectedCount);
}

TEST(FSM, magicMacrosExample) {
  struct MyFSM {
    FSM<State> fsm_;
    int count = 0;
    int unprotectedCount = 0;
    MyFSM() : fsm_(State::A) {}
    void twiddle() {
      FSM_START(fsm_)
        FSM_CASE(fsm_, State::A, State::B, [&]{ count++; });
        FSM_CASE2(fsm_, State::B, State::A,
                  [&]{ count--; }, [&]{ unprotectedCount--; });
      FSM_END
    }
  };

  MyFSM fsm;

  fsm.twiddle();
  EXPECT_EQ(State::B, fsm.fsm_.getState());
  EXPECT_EQ(1, fsm.count);
  EXPECT_EQ(0, fsm.unprotectedCount);

  fsm.twiddle();
  EXPECT_EQ(State::A, fsm.fsm_.getState());
  EXPECT_EQ(0, fsm.count);
  EXPECT_EQ(-1, fsm.unprotectedCount);
}


TEST(FSM, ctor) {
  FSM<State> fsm(State::A);
  EXPECT_EQ(State::A, fsm.getState());
}

TEST(FSM, update) {
  FSM<State> fsm(State::A);
  EXPECT_TRUE(fsm.updateState(State::A, State::B, []{}));
  EXPECT_EQ(State::B, fsm.getState());
}

TEST(FSM, badUpdate) {
  FSM<State> fsm(State::A);
  EXPECT_FALSE(fsm.updateState(State::B, State::A, []{}));
}

TEST(FSM, actionOnUpdate) {
  FSM<State> fsm(State::A);
  int count = 0;
  fsm.updateState(State::A, State::B, [&]{ count++; });
  EXPECT_EQ(1, count);
}

TEST(FSM, noActionOnBadUpdate) {
  FSM<State> fsm(State::A);
  int count = 0;
  fsm.updateState(State::B, State::A, [&]{ count++; });
  EXPECT_EQ(0, count);
}

TEST(FSM, stateTransitionAfterAction) {
  FSM<State> fsm(State::A);
  fsm.updateState(State::A, State::B,
                  [&]{ EXPECT_EQ(State::A, fsm.getState()); });
}
