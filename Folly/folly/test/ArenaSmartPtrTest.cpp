/*
 * Copyright 2013-present Facebook, Inc.
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
 * @author: Marcelo Juchem <marcelo@fb.com>
 */

#include <folly/Memory.h>
#include <folly/memory/Arena.h>
#include <folly/portability/GTest.h>

using namespace folly;

struct global_counter {
  global_counter() : count_(0) {}

  void increase() {
    ++count_;
  }
  void decrease() {
    EXPECT_GT(count_, 0);
    --count_;
  }

  unsigned count() const {
    return count_;
  }

 private:
  unsigned count_;
};

struct Foo {
  explicit Foo(global_counter& counter) : counter_(counter) {
    counter_.increase();
  }

  ~Foo() {
    counter_.decrease();
  }

 private:
  global_counter& counter_;
};

template <typename Allocator>
void unique_ptr_test(Allocator& allocator) {
  using ptr_type = std::unique_ptr<Foo, allocator_delete<Allocator>>;

  global_counter counter;
  EXPECT_EQ(counter.count(), 0);

  Foo* foo = nullptr;

  {
    auto p = folly::allocate_unique<Foo>(allocator, counter);
    EXPECT_EQ(counter.count(), 1);

    p.reset();
    EXPECT_EQ(counter.count(), 0);

    p = folly::allocate_unique<Foo>(allocator, counter);
    EXPECT_EQ(counter.count(), 1);

    foo = p.release();
    EXPECT_EQ(counter.count(), 1);
  }
  EXPECT_EQ(counter.count(), 1);

  {
    auto p = folly::allocate_unique<Foo>(allocator, counter);
    EXPECT_EQ(counter.count(), 2);

    [&](ptr_type g) {
      EXPECT_EQ(counter.count(), 2);
      g.reset();
      EXPECT_EQ(counter.count(), 1);
    }(std::move(p));
  }
  EXPECT_EQ(counter.count(), 1);

  std::allocator_traits<Allocator>::destroy(allocator, foo);
  EXPECT_EQ(counter.count(), 0);
}

TEST(ArenaSmartPtr, unique_ptr_SysArena) {
  SysArena arena;
  SysArenaAllocator<Foo> alloc(arena);
  unique_ptr_test(alloc);
}

template <typename Allocator>
void shared_ptr_test(Allocator& allocator) {
  typedef std::shared_ptr<Foo> ptr_type;

  global_counter counter;
  EXPECT_EQ(counter.count(), 0);

  ptr_type foo;
  EXPECT_EQ(counter.count(), 0);
  EXPECT_EQ(foo.use_count(), 0);

  {
    auto p = std::allocate_shared<Foo>(allocator, counter);
    EXPECT_EQ(counter.count(), 1);
    EXPECT_EQ(p.use_count(), 1);

    p.reset();
    EXPECT_EQ(counter.count(), 0);
    EXPECT_EQ(p.use_count(), 0);

    p = std::allocate_shared<Foo>(allocator, counter);
    EXPECT_EQ(counter.count(), 1);
    EXPECT_EQ(p.use_count(), 1);

    foo = p;
    EXPECT_EQ(p.use_count(), 2);
  }
  EXPECT_EQ(counter.count(), 1);
  EXPECT_EQ(foo.use_count(), 1);

  {
    auto p = foo;
    EXPECT_EQ(counter.count(), 1);
    EXPECT_EQ(p.use_count(), 2);

    [&](ptr_type g) {
      EXPECT_EQ(counter.count(), 1);
      EXPECT_EQ(p.use_count(), 3);
      EXPECT_EQ(g.use_count(), 3);
      g.reset();
      EXPECT_EQ(counter.count(), 1);
      EXPECT_EQ(p.use_count(), 2);
      EXPECT_EQ(g.use_count(), 0);
    }(p);
    EXPECT_EQ(counter.count(), 1);
    EXPECT_EQ(p.use_count(), 2);
  }
  EXPECT_EQ(counter.count(), 1);
  EXPECT_EQ(foo.use_count(), 1);

  foo.reset();
  EXPECT_EQ(counter.count(), 0);
  EXPECT_EQ(foo.use_count(), 0);
}

TEST(ArenaSmartPtr, shared_ptr_SysArena) {
  SysArena arena;
  SysArenaAllocator<Foo> alloc(arena);
  shared_ptr_test(alloc);
}

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
