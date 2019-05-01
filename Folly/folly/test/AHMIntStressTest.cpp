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

#include <memory>
#include <mutex>
#include <thread>

#include <folly/AtomicHashMap.h>
#include <folly/Memory.h>
#include <folly/ScopeGuard.h>
#include <folly/portability/GTest.h>

namespace {

struct MyObject {
  explicit MyObject(int i_) : i(i_) {}
  int i;
};

typedef folly::AtomicHashMap<int, std::shared_ptr<MyObject>> MyMap;
typedef std::lock_guard<std::mutex> Guard;

std::unique_ptr<MyMap> newMap() {
  return std::make_unique<MyMap>(100);
}

struct MyObjectDirectory {
  MyObjectDirectory() : cur_(newMap()), prev_(newMap()) {}

  std::shared_ptr<MyObject> get(int key) {
    auto val = tryGet(key);
    if (val) {
      return val;
    }

    std::shared_ptr<MyMap> cur;
    {
      Guard g(lock_);
      cur = cur_;
    }

    auto ret = cur->insert(key, std::make_shared<MyObject>(key));
    return ret.first->second;
  }

  std::shared_ptr<MyObject> tryGet(int key) {
    std::shared_ptr<MyMap> cur;
    std::shared_ptr<MyMap> prev;
    {
      Guard g(lock_);
      cur = cur_;
      prev = prev_;
    }

    auto it = cur->find(key);
    if (it != cur->end()) {
      return it->second;
    }

    it = prev->find(key);
    if (it != prev->end()) {
      auto ret = cur->insert(key, it->second);
      return ret.first->second;
    }

    return nullptr;
  }

  void archive() {
    std::shared_ptr<MyMap> cur(newMap());

    Guard g(lock_);
    prev_ = cur_;
    cur_ = cur;
  }

  std::mutex lock_;
  std::shared_ptr<MyMap> cur_;
  std::shared_ptr<MyMap> prev_;
};

} // namespace

//////////////////////////////////////////////////////////////////////

/*
 * This test case stresses ThreadLocal allocation/deallocation heavily
 * via ThreadCachedInt and AtomicHashMap, and a bunch of other
 * mallocing.
 */
TEST(AHMIntStressTest, Test) {
  auto const objs = new MyObjectDirectory();
  SCOPE_EXIT {
    delete objs;
  };

  std::vector<std::thread> threads;
  for (int threadId = 0; threadId < 64; ++threadId) {
    threads.emplace_back([objs] {
      for (int recycles = 0; recycles < 500; ++recycles) {
        for (int i = 0; i < 10; i++) {
          auto val = objs->get(i);
        }

        objs->archive();
      }
    });
  }

  for (auto& t : threads) {
    t.join();
  }
}
