/*
 * Copyright 2016-present Facebook, Inc.
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

#include <algorithm>
#include <thread>

#include <folly/AtomicLinkedList.h>
#include <folly/portability/GTest.h>

class TestIntrusiveObject {
 public:
  explicit TestIntrusiveObject(size_t id__) : id_(id__) {}
  size_t id() {
    return id_;
  }

 private:
  folly::AtomicIntrusiveLinkedListHook<TestIntrusiveObject> hook_;
  size_t id_;

 public:
  using List = folly::AtomicIntrusiveLinkedList<
      TestIntrusiveObject,
      &TestIntrusiveObject::hook_>;
};

TEST(AtomicIntrusiveLinkedList, Basic) {
  TestIntrusiveObject a(1), b(2), c(3);

  TestIntrusiveObject::List list;

  EXPECT_TRUE(list.empty());

  {
    EXPECT_TRUE(list.insertHead(&a));
    EXPECT_FALSE(list.insertHead(&b));

    EXPECT_FALSE(list.empty());

    size_t id = 0;
    list.sweep([&](TestIntrusiveObject* obj) mutable {
      ++id;
      EXPECT_EQ(id, obj->id());
    });

    EXPECT_TRUE(list.empty());
  }

  // Try re-inserting the same item (b) and a new item (c)
  {
    EXPECT_TRUE(list.insertHead(&b));
    EXPECT_FALSE(list.insertHead(&c));

    EXPECT_FALSE(list.empty());

    size_t id = 1;
    list.sweep([&](TestIntrusiveObject* obj) mutable {
      ++id;
      EXPECT_EQ(id, obj->id());
    });

    EXPECT_TRUE(list.empty());
  }

  TestIntrusiveObject::List movedList = std::move(list);
}

TEST(AtomicIntrusiveLinkedList, ReverseSweep) {
  TestIntrusiveObject a(1), b(2), c(3);
  TestIntrusiveObject::List list;
  list.insertHead(&a);
  list.insertHead(&b);
  list.insertHead(&c);
  size_t next_expected_id = 3;
  list.reverseSweep([&](TestIntrusiveObject* obj) {
    auto const expected = next_expected_id--;
    EXPECT_EQ(expected, obj->id());
  });
  EXPECT_TRUE(list.empty());
  // Test that we can still insert
  list.insertHead(&a);
  EXPECT_FALSE(list.empty());
  list.reverseSweep([](TestIntrusiveObject*) {});
}

TEST(AtomicIntrusiveLinkedList, Move) {
  TestIntrusiveObject a(1), b(2);

  TestIntrusiveObject::List list1;

  EXPECT_TRUE(list1.insertHead(&a));
  EXPECT_FALSE(list1.insertHead(&b));

  EXPECT_FALSE(list1.empty());

  TestIntrusiveObject::List list2(std::move(list1));

  EXPECT_TRUE(list1.empty());
  EXPECT_FALSE(list2.empty());

  TestIntrusiveObject::List list3;

  EXPECT_TRUE(list3.empty());

  list3 = std::move(list2);

  EXPECT_TRUE(list2.empty());
  EXPECT_FALSE(list3.empty());

  size_t id = 0;
  list3.sweep([&](TestIntrusiveObject* obj) mutable {
    ++id;
    EXPECT_EQ(id, obj->id());
  });
}

TEST(AtomicIntrusiveLinkedList, Stress) {
  static constexpr size_t kNumThreads = 32;
  static constexpr size_t kNumElements = 100000;

  std::vector<TestIntrusiveObject> elements;
  for (size_t i = 0; i < kNumThreads * kNumElements; ++i) {
    elements.emplace_back(i);
  }

  TestIntrusiveObject::List list;

  std::vector<std::thread> threads;
  for (size_t threadId = 0; threadId < kNumThreads; ++threadId) {
    threads.emplace_back([threadId, &list, &elements] {
      for (size_t id = 0; id < kNumElements; ++id) {
        list.insertHead(&elements[threadId + kNumThreads * id]);
      }
    });
  }

  std::vector<size_t> ids;
  TestIntrusiveObject* prev{nullptr};

  while (ids.size() < kNumThreads * kNumElements) {
    list.sweep([&](TestIntrusiveObject* current) {
      ids.push_back(current->id());

      if (prev && prev->id() % kNumThreads == current->id() % kNumThreads) {
        EXPECT_EQ(prev->id() + kNumThreads, current->id());
      }

      prev = current;
    });
  }

  std::sort(ids.begin(), ids.end());

  for (size_t i = 0; i < kNumThreads * kNumElements; ++i) {
    EXPECT_EQ(i, ids[i]);
  }

  for (auto& thread : threads) {
    thread.join();
  }
}

class TestObject {
 public:
  TestObject(size_t id__, const std::shared_ptr<void>& ptr)
      : id_(id__), ptr_(ptr) {}

  size_t id() {
    return id_;
  }

 private:
  size_t id_;
  std::shared_ptr<void> ptr_;
};

TEST(AtomicLinkedList, Basic) {
  constexpr size_t kNumElements = 10;

  using List = folly::AtomicLinkedList<TestObject>;
  List list;

  std::shared_ptr<void> ptr = std::make_shared<int>(42);

  for (size_t id = 0; id < kNumElements; ++id) {
    list.insertHead({id, ptr});
  }

  size_t counter = 0;

  list.sweep([&](TestObject object) {
    EXPECT_EQ(counter, object.id());

    EXPECT_EQ(1 + kNumElements - counter, ptr.use_count());

    ++counter;
  });

  EXPECT_TRUE(ptr.unique());
}
