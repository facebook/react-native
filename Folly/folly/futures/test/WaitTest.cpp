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

#include <queue>

#include <folly/futures/Future.h>
#include <folly/io/async/EventBase.h>
#include <folly/Baton.h>
#include <folly/portability/GTest.h>

using namespace folly;
using std::vector;
using std::chrono::milliseconds;

TEST(Wait, waitImmediate) {
  makeFuture().wait();
  auto done = makeFuture(42).wait().value();
  EXPECT_EQ(42, done);

  vector<int> v{1,2,3};
  auto done_v = makeFuture(v).wait().value();
  EXPECT_EQ(v.size(), done_v.size());
  EXPECT_EQ(v, done_v);

  vector<Future<Unit>> v_f;
  v_f.push_back(makeFuture());
  v_f.push_back(makeFuture());
  auto done_v_f = collectAll(v_f).wait().value();
  EXPECT_EQ(2, done_v_f.size());

  vector<Future<bool>> v_fb;
  v_fb.push_back(makeFuture(true));
  v_fb.push_back(makeFuture(false));
  auto fut = collectAll(v_fb);
  auto done_v_fb = std::move(fut.wait().value());
  EXPECT_EQ(2, done_v_fb.size());
}

TEST(Wait, wait) {
  Promise<int> p;
  Future<int> f = p.getFuture();
  std::atomic<bool> flag{false};
  std::atomic<int> result{1};
  std::atomic<std::thread::id> id;

  std::thread t([&](Future<int>&& tf){
      auto n = tf.then([&](Try<int> && t) {
          id = std::this_thread::get_id();
          return t.value();
        });
      flag = true;
      result.store(n.wait().value());
    },
    std::move(f)
    );
  while(!flag){}
  EXPECT_EQ(result.load(), 1);
  p.setValue(42);
  t.join();
  // validate that the callback ended up executing in this thread, which
  // is more to ensure that this test actually tests what it should
  EXPECT_EQ(id, std::this_thread::get_id());
  EXPECT_EQ(result.load(), 42);
}

struct MoveFlag {
  MoveFlag() = default;
  MoveFlag& operator=(const MoveFlag&) = delete;
  MoveFlag(const MoveFlag&) = delete;
  MoveFlag(MoveFlag&& other) noexcept {
    other.moved = true;
  }
  bool moved{false};
};

TEST(Wait, waitReplacesSelf) {
  // wait
  {
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.wait();
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).wait();
    EXPECT_FALSE(f2.value().moved);
  }

  // wait(Duration)
  {
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.wait(milliseconds(1));
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).wait(milliseconds(1));
    EXPECT_FALSE(f2.value().moved);
  }

  // waitVia
  {
    folly::EventBase eb;
    // lvalue
    auto f1 = makeFuture(MoveFlag());
    f1.waitVia(&eb);
    EXPECT_FALSE(f1.value().moved);

    // rvalue
    auto f2 = makeFuture(MoveFlag()).waitVia(&eb);
    EXPECT_FALSE(f2.value().moved);
  }
}

TEST(Wait, waitWithDuration) {
 {
  Promise<int> p;
  Future<int> f = p.getFuture();
  f.wait(milliseconds(1));
  EXPECT_FALSE(f.isReady());
  p.setValue(1);
  EXPECT_TRUE(f.isReady());
 }
 {
  Promise<int> p;
  Future<int> f = p.getFuture();
  p.setValue(1);
  f.wait(milliseconds(1));
  EXPECT_TRUE(f.isReady());
 }
 {
  vector<Future<bool>> v_fb;
  v_fb.push_back(makeFuture(true));
  v_fb.push_back(makeFuture(false));
  auto f = collectAll(v_fb);
  f.wait(milliseconds(1));
  EXPECT_TRUE(f.isReady());
  EXPECT_EQ(2, f.value().size());
 }
 {
  vector<Future<bool>> v_fb;
  Promise<bool> p1;
  Promise<bool> p2;
  v_fb.push_back(p1.getFuture());
  v_fb.push_back(p2.getFuture());
  auto f = collectAll(v_fb);
  f.wait(milliseconds(1));
  EXPECT_FALSE(f.isReady());
  p1.setValue(true);
  EXPECT_FALSE(f.isReady());
  p2.setValue(true);
  EXPECT_TRUE(f.isReady());
 }
 {
  auto f = makeFuture().wait(milliseconds(1));
  EXPECT_TRUE(f.isReady());
 }

 {
   Promise<Unit> p;
   auto start = std::chrono::steady_clock::now();
   auto f = p.getFuture().wait(milliseconds(100));
   auto elapsed = std::chrono::steady_clock::now() - start;
   EXPECT_GE(elapsed, milliseconds(100));
   EXPECT_FALSE(f.isReady());
   p.setValue();
   EXPECT_TRUE(f.isReady());
 }

 {
   // Try to trigger the race where the resultant Future is not yet complete
   // even if we didn't hit the timeout, and make sure we deal with it properly
   Promise<Unit> p;
   folly::Baton<> b;
   auto t = std::thread([&]{
     b.post();
     /* sleep override */ std::this_thread::sleep_for(milliseconds(100));
     p.setValue();
   });
   b.wait();
   auto f = p.getFuture().wait(std::chrono::seconds(3600));
   EXPECT_TRUE(f.isReady());
   t.join();
 }
}

TEST(Wait, multipleWait) {
  auto f = futures::sleep(milliseconds(100));
  for (size_t i = 0; i < 5; ++i) {
    EXPECT_FALSE(f.isReady());
    f.wait(milliseconds(3));
  }
  EXPECT_FALSE(f.isReady());
  f.wait();
  EXPECT_TRUE(f.isReady());
  f.wait();
  EXPECT_TRUE(f.isReady());
}
