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

#include <ios>
#include <iostream>
#include <memory>
#include <scoped_allocator>
#include <string>
#include <vector>

#include <boost/interprocess/allocators/adaptive_pool.hpp>
#include <boost/interprocess/managed_shared_memory.hpp>

#include <folly/Format.h>
#include <folly/Random.h>
#include <folly/Traits.h>
#include <folly/container/F14Map.h>
#include <folly/container/F14Set.h>
#include <folly/container/test/F14TestUtil.h>
#include <folly/portability/GTest.h>

using namespace boost::interprocess;

template <typename T>
using ShmAllocator = adaptive_pool<T, managed_shared_memory::segment_manager>;

template <typename K, typename M>
using ShmF14ValueMap = folly::F14ValueMap<
    K,
    M,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<std::pair<K const, M>>>;

template <typename K, typename M>
using ShmF14NodeMap = folly::F14NodeMap<
    K,
    M,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<std::pair<K const, M>>>;

template <typename K, typename M>
using ShmF14VectorMap = folly::F14VectorMap<
    K,
    M,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<std::pair<K const, M>>>;

template <typename K>
using ShmF14ValueSet = folly::F14ValueSet<
    K,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<K>>;

template <typename K>
using ShmF14NodeSet = folly::F14NodeSet<
    K,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<K>>;

template <typename K>
using ShmF14VectorSet = folly::F14VectorSet<
    K,
    folly::f14::DefaultHasher<K>,
    folly::f14::DefaultKeyEqual<K>,
    ShmAllocator<K>>;

using ShmVI = std::vector<int, ShmAllocator<int>>;
using ShmVVI =
    std::vector<ShmVI, std::scoped_allocator_adaptor<ShmAllocator<ShmVI>>>;

using ShmF14ValueI2VVI = folly::F14ValueMap<
    int,
    ShmVVI,
    folly::f14::DefaultHasher<int>,
    folly::f14::DefaultKeyEqual<int>,
    std::scoped_allocator_adaptor<ShmAllocator<std::pair<int const, ShmVVI>>>>;

using ShmF14NodeI2VVI = folly::F14NodeMap<
    int,
    ShmVVI,
    folly::f14::DefaultHasher<int>,
    folly::f14::DefaultKeyEqual<int>,
    std::scoped_allocator_adaptor<ShmAllocator<std::pair<int const, ShmVVI>>>>;

using ShmF14VectorI2VVI = folly::F14VectorMap<
    int,
    ShmVVI,
    folly::f14::DefaultHasher<int>,
    folly::f14::DefaultKeyEqual<int>,
    std::scoped_allocator_adaptor<ShmAllocator<std::pair<int const, ShmVVI>>>>;

namespace {
std::string makeRandomName() {
  return folly::sformat("f14test_{}", folly::Random::rand64());
}

std::shared_ptr<managed_shared_memory> makeShmSegment(
    std::size_t n,
    std::string name = makeRandomName()) {
  auto deleter = [=](managed_shared_memory* p) {
    delete p;
    shared_memory_object::remove(name.c_str());
  };

  auto segment = new managed_shared_memory(create_only, name.c_str(), n);
  return std::shared_ptr<managed_shared_memory>(segment, deleter);
}
} // namespace

template <typename M>
void runSimpleMapTest() {
  auto segment = makeShmSegment(8192);
  auto mgr = segment->get_segment_manager();
  ShmAllocator<std::pair<int const, int>> alloc{mgr};
  M m{alloc};
  for (int i = 0; i < 20; ++i) {
    m[i] = i * 10;
  }
  EXPECT_EQ(m.size(), 20);
  for (int i = 0; i < 20; ++i) {
    EXPECT_EQ(m[i], i * 10);
  }
}

template <typename S>
void runSimpleSetTest() {
  auto segment = makeShmSegment(8192);
  auto mgr = segment->get_segment_manager();
  S s{typename S::allocator_type{mgr}};
  for (int i = 0; i < 20; ++i) {
    s.insert(i);
  }
  EXPECT_EQ(s.size(), 20);
  for (int i = 0; i < 40; ++i) {
    EXPECT_EQ(s.count(i), (i < 20 ? 1 : 0));
  }
}

TEST(ShmF14ValueMap, simple) {
  runSimpleMapTest<ShmF14ValueMap<int, int>>();
}
TEST(ShmF14NodeMap, simple) {
  runSimpleMapTest<ShmF14NodeMap<int, int>>();
}
TEST(ShmF14VectorMap, simple) {
  runSimpleMapTest<ShmF14VectorMap<int, int>>();
}
TEST(ShmF14ValueSet, simple) {
  runSimpleSetTest<ShmF14ValueSet<int>>();
}
TEST(ShmF14NodeSet, simple) {
  runSimpleSetTest<ShmF14NodeSet<int>>();
}
TEST(ShmF14VectorSet, simple) {
  runSimpleSetTest<ShmF14VectorSet<int>>();
}

template <typename M>
void runSimultaneousAccessMapTest() {
  using namespace folly::f14::detail;

  // fallback std::unordered_map on libstdc++ doesn't pass this test
  if (getF14IntrinsicsMode() != F14IntrinsicsMode::None) {
    auto name = makeRandomName();
    auto segment1 = makeShmSegment(8192, name);
    auto segment2 =
        std::make_shared<managed_shared_memory>(open_only, name.c_str());

    auto m1 = segment1->construct<M>("m")(
        typename M::allocator_type{segment1->get_segment_manager()});
    auto m2 = segment2->find<M>("m").first;

    std::cout << "m in segment1 @ " << (uintptr_t)m1 << "\n";
    std::cout << "m in segment2 @ " << (uintptr_t)m2 << "\n";

    EXPECT_NE(&*m1, &*m2);

    (*m1)[1] = 10;
    EXPECT_EQ(m2->count(0), 0);
    EXPECT_EQ((*m2)[1], 10);
    (*m2)[2] = 20;
    EXPECT_EQ(m1->size(), 2);
    EXPECT_EQ(m1->find(2)->second, 20);
    (*m1)[3] = 30;
    EXPECT_EQ(m2->size(), 3);
    EXPECT_FALSE(m2->emplace(std::make_pair(3, 33)).second);
  }
}

TEST(ShmF14ValueMap, simultaneous) {
  runSimultaneousAccessMapTest<ShmF14ValueMap<int, int>>();
}
TEST(ShmF14NodeMap, simultaneous) {
  runSimultaneousAccessMapTest<ShmF14NodeMap<int, int>>();
}
TEST(ShmF14VectorMap, simultaneous) {
  runSimultaneousAccessMapTest<ShmF14VectorMap<int, int>>();
}

template <typename T>
void checkSingleLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    T const& val) {
  auto beginAddr = reinterpret_cast<uintptr_t>(segment->get_address());
  auto endAddr = beginAddr + segment->get_size();
  auto addr = reinterpret_cast<uintptr_t>(&val);
  EXPECT_TRUE(beginAddr <= addr && addr + sizeof(T) <= endAddr)
      << name << ": begin @" << std::hex << beginAddr << ", val @" << std::hex
      << addr << ", size" << std::hex << sizeof(T) << ", end @" << std::hex
      << endAddr;
}

void checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    int const& val);

template <typename A, typename B>
void checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    std::pair<A, B> const& val);

template <typename T>
auto checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    T const& val) -> folly::void_t<decltype(val.begin())>;

void checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    int const& val) {
  checkSingleLocation(name, segment, val);
}

template <typename A, typename B>
void checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    std::pair<A, B> const& val) {
  checkSingleLocation(name, segment, val);
  checkLocation(name + ".first", segment, val.first);
  checkLocation(name + ".second", segment, val.second);
}

template <typename T>
auto checkLocation(
    std::string name,
    std::shared_ptr<managed_shared_memory> const& segment,
    T const& val) -> folly::void_t<decltype(val.begin())> {
  typename T::allocator_type alloc{segment->get_segment_manager()};
  EXPECT_TRUE(alloc == val.get_allocator());
  checkSingleLocation(name, segment, val);
  for (auto&& v : val) {
    checkLocation(name + "[]", segment, v);
  }
}

template <typename M>
void runScopedAllocatorTest() {
  auto segment = makeShmSegment(8192);
  auto mgr = segment->get_segment_manager();

  auto vi = segment->construct<ShmVI>(anonymous_instance)(
      typename ShmVI::allocator_type{mgr});
  vi->push_back(10);
  checkLocation("vi", segment, *vi);

  auto vvi = segment->construct<ShmVVI>(anonymous_instance)(
      typename ShmVVI::allocator_type{mgr});
  vvi->resize(1);
  vvi->at(0).push_back(2);
  checkLocation("vvi", segment, *vvi);

  auto m = segment->construct<M>(anonymous_instance)(
      typename M::allocator_type{mgr});
  (*m)[1].emplace_back();
  (*m)[1][0].push_back(3);

  checkLocation("m", segment, *m);
  m->clear();
}

TEST(ShmF14ValueI2VVI, scopedAllocator) {
  runScopedAllocatorTest<ShmF14ValueI2VVI>();
}
TEST(ShmF14NodeI2VVI, scopedAllocator) {
  runScopedAllocatorTest<ShmF14NodeI2VVI>();
}
TEST(ShmF14VectorI2VVI, scopedAllocator) {
  runScopedAllocatorTest<ShmF14VectorI2VVI>();
}

template <typename M>
void runMultiScopeTest() {
  auto segment1 = makeShmSegment(8192);
  auto mgr1 = segment1->get_segment_manager();

  auto segment2 = makeShmSegment(8192);
  auto mgr2 = segment2->get_segment_manager();

  auto a1 = segment1->construct<M>(anonymous_instance)(
      typename M::allocator_type{mgr1});
  (*a1)[1].emplace_back();
  (*a1)[1][0].push_back(3);
  auto b1 = segment1->construct<M>(anonymous_instance)(*a1);
  auto c1 = segment1->construct<M>(anonymous_instance)(std::move(*a1));

  auto d2 = segment2->construct<M>(anonymous_instance)(
      typename M::allocator_type{mgr2});
  (*d2)[10].emplace_back();
  (*d2)[10][0].push_back(6);
  auto e2 = segment2->construct<M>(anonymous_instance)(*d2);
  auto f2 = segment2->construct<M>(anonymous_instance)(
      *b1, typename M::allocator_type{mgr2});

  checkLocation("a1", segment1, *a1);
  checkLocation("b1", segment1, *b1);
  checkLocation("c1", segment1, *c1);
  checkLocation("d2", segment2, *d2);
  checkLocation("e2", segment2, *e2);
  checkLocation("f2", segment2, *f2);

  EXPECT_EQ(a1->size(), 0);
  EXPECT_FALSE(*a1 == *b1);
  EXPECT_TRUE(*b1 == *c1);
  EXPECT_TRUE(*b1 == *f2);
  EXPECT_EQ(d2->size(), 1);
  EXPECT_EQ(e2->size(), 1);
  EXPECT_FALSE(*e2 == *f2);

  checkLocation("d2", segment2, *d2);

  EXPECT_TRUE(*d2 == *e2);

  f2->clear();
  *f2 = std::move(*d2);

  checkLocation("d2", segment2, *d2);
  checkLocation("f2", segment2, *f2);

  EXPECT_TRUE(*f2 == *e2);
  EXPECT_TRUE(d2->empty());

  {
    using std::swap;
    swap(*a1, *b1);
  }
  checkLocation("a1", segment1, *a1);
  checkLocation("b1", segment1, *b1);
  EXPECT_TRUE(*a1 == *c1);

  *a1 = std::move(*e2);

  EXPECT_TRUE(*f2 == *a1);

  checkLocation("a1", segment1, *a1);
  checkLocation("e2", segment2, *e2);

  auto g2 = segment2->construct<M>(anonymous_instance)(
      std::move(*a1), typename M::allocator_type{mgr2});

  EXPECT_TRUE(*f2 == *g2);

  checkLocation("f2", segment2, *f2);
  checkLocation("g2", segment2, *g2);

  segment1->destroy_ptr(a1);
  segment1->destroy_ptr(b1);
  segment1->destroy_ptr(c1);
  segment2->destroy_ptr(d2);
  segment2->destroy_ptr(e2);
  segment2->destroy_ptr(f2);
  segment2->destroy_ptr(g2);
}

TEST(ShmF14ValueI2VVI, multiScope) {
  runMultiScopeTest<ShmF14ValueI2VVI>();
}
TEST(ShmF14NodeI2VVI, multiScope) {
  runMultiScopeTest<ShmF14NodeI2VVI>();
}
TEST(ShmF14VectorI2VVI, multiScope) {
  runMultiScopeTest<ShmF14VectorI2VVI>();
}
