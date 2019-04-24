/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/PackedSyncPtr.h>

#include <cinttypes>
#include <thread>
#include <unordered_map>
#include <utility>

#include <folly/portability/GTest.h>

using folly::PackedSyncPtr;

namespace {

// Compile time check for packability.  This requires that
// PackedSyncPtr is a POD struct on gcc.
FOLLY_PACK_PUSH
struct ignore {
  PackedSyncPtr<int> foo;
  char c;
} FOLLY_PACK_ATTR;
FOLLY_PACK_POP
static_assert(sizeof(ignore) == 9, "PackedSyncPtr wasn't packable");

} // namespace

TEST(PackedSyncPtr, Basic) {
  PackedSyncPtr<std::pair<int, int>> sp;
  sp.init(new std::pair<int, int>[2]);
  EXPECT_EQ(sizeof(sp), 8);
  sp->first = 5;
  EXPECT_EQ(sp[0].first, 5);
  sp[1].second = 7;
  EXPECT_EQ(sp[1].second, 7);
  sp.lock();
  EXPECT_EQ(sp[1].second, 7);
  sp[0].first = 9;
  EXPECT_EQ(sp->first, 9);
  sp.unlock();
  EXPECT_EQ((sp.get() + 1)->second, 7);

  sp.lock();
  EXPECT_EQ(sp.extra(), 0);
  sp.setExtra(0x13);
  EXPECT_EQ(sp.extra(), 0x13);
  EXPECT_EQ((sp.get() + 1)->second, 7);
  delete[] sp.get();
  auto newP = new std::pair<int, int>();
  sp.set(newP);
  EXPECT_EQ(sp.extra(), 0x13);
  EXPECT_EQ(sp.get(), newP);
  sp.unlock();
  delete sp.get();
}

// Here we use the PackedSyncPtr to lock the whole SyncVec (base, *base, and sz)
template <typename T>
struct SyncVec {
  PackedSyncPtr<T> base;
  SyncVec() {
    base.init();
  }
  ~SyncVec() {
    free(base.get());
  }
  void push_back(const T& t) {
    base.set((T*)realloc(base.get(), (base.extra() + 1) * sizeof(T)));
    base[base.extra()] = t;
    base.setExtra(base.extra() + 1);
  }
  void lock() {
    base.lock();
  }
  void unlock() {
    base.unlock();
  }

  T* begin() const {
    return base.get();
  }
  T* end() const {
    return base.get() + base.extra();
  }
};
typedef SyncVec<intptr_t> VecT;
typedef std::unordered_map<int64_t, VecT> Map;
const int mapCap = 1317;
const int nthrs = 297;
static Map map(mapCap);

// Each app thread inserts it's ID into every vec in map
// map is read only, so doesn't need any additional locking
void appThread(intptr_t id) {
  for (auto& kv : map) {
    kv.second.lock();
    kv.second.push_back(id);
    kv.second.unlock();
  }
}

TEST(PackedSyncPtr, Application) {
  for (int64_t i = 0; i < mapCap / 2; ++i) {
    map.insert(std::make_pair(i, VecT()));
  }
  std::vector<std::thread> thrs;
  for (intptr_t i = 0; i < nthrs; i++) {
    thrs.push_back(std::thread(appThread, i));
  }
  for (auto& t : thrs) {
    t.join();
  }

  for (auto& kv : map) {
    // Make sure every thread successfully inserted it's ID into every vec
    std::set<intptr_t> idsFound;
    for (auto& elem : kv.second) {
      EXPECT_TRUE(idsFound.insert(elem).second); // check for dups
    }
    EXPECT_EQ(idsFound.size(), nthrs); // check they are all there
  }
}

TEST(PackedSyncPtr, extraData) {
  PackedSyncPtr<int> p;
  p.init();
  int* unaligned = reinterpret_cast<int*>(0xf003);
  p.lock();
  p.set(unaligned);
  uintptr_t* bytes = reinterpret_cast<uintptr_t*>(&p);
  LOG(INFO) << "Bytes integer is: 0x" << std::hex << *bytes;
  EXPECT_EQ(p.get(), unaligned);
  p.unlock();
}
