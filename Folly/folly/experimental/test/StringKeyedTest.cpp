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
// Copyright 2013-present Facebook. All Rights Reserved.

#include <folly/experimental/StringKeyedMap.h>
#include <folly/experimental/StringKeyedSet.h>
#include <folly/experimental/StringKeyedUnorderedMap.h>
#include <folly/experimental/StringKeyedUnorderedSet.h>

#include <list>
#include <string>

#include <glog/logging.h>

#include <folly/Range.h>
#include <folly/hash/Hash.h>
#include <folly/portability/GFlags.h>
#include <folly/portability/GTest.h>

using folly::BasicStringKeyedUnorderedSet;
using folly::StringKeyedMap;
using folly::StringKeyedSetBase;
using folly::StringKeyedUnorderedMap;
using folly::StringPiece;
using std::string;

static unsigned long long allocated = 0;
static unsigned long long freed = 0;

template <typename Alloc>
struct MemoryLeakCheckerAllocator {
  typedef typename Alloc::value_type value_type;
  typedef value_type* pointer;
  typedef value_type const* const_pointer;
  typedef value_type& reference;
  typedef value_type const* const_reference;

  typedef std::ptrdiff_t difference_type;
  typedef std::size_t size_type;

  explicit MemoryLeakCheckerAllocator() {}

  explicit MemoryLeakCheckerAllocator(Alloc alloc) : alloc_(alloc) {}

  template <class UAlloc>
  MemoryLeakCheckerAllocator(const MemoryLeakCheckerAllocator<UAlloc>& other)
      : alloc_(other.allocator()) {}

  value_type* allocate(size_t n, const void* hint = nullptr) {
    auto p = alloc_.allocate(n, hint);
    allocated += n * sizeof(value_type);
    return p;
  }

  void deallocate(value_type* p, size_t n) {
    alloc_.deallocate(p, n);
    freed += n * sizeof(value_type);
  }

  size_t max_size() const {
    return alloc_.max_size();
  }

  template <class... Args>
  void construct(value_type* p, Args&&... args) {
    alloc_.construct(p, std::forward<Args>(args)...);
  }

  void destroy(value_type* p) {
    alloc_.destroy(p);
  }

  template <class U>
  struct rebind {
    typedef MemoryLeakCheckerAllocator<
        typename std::allocator_traits<Alloc>::template rebind_alloc<U>>
        other;
  };

  const Alloc& allocator() const {
    return alloc_;
  }

  bool operator!=(const MemoryLeakCheckerAllocator& other) const {
    return alloc_ != other.alloc_;
  }

  bool operator==(const MemoryLeakCheckerAllocator& other) const {
    return alloc_ == other.alloc_;
  }

 private:
  Alloc alloc_;
};

using KeyValuePairLeakChecker = MemoryLeakCheckerAllocator<
    std::allocator<std::pair<const StringPiece, int>>>;
using ValueLeakChecker =
    MemoryLeakCheckerAllocator<std::allocator<StringPiece>>;

using LeakCheckedUnorderedMap = StringKeyedUnorderedMap<
    int,
    folly::hasher<StringPiece>,
    std::equal_to<StringPiece>,
    MemoryLeakCheckerAllocator<
        std::allocator<std::pair<const std::string, int>>>>;

typedef StringKeyedSetBase<std::less<StringPiece>, ValueLeakChecker>
    LeakCheckedSet;

typedef StringKeyedMap<int, std::less<StringPiece>, KeyValuePairLeakChecker>
    LeakCheckedMap;

using LeakCheckedUnorderedSet = BasicStringKeyedUnorderedSet<
    folly::hasher<StringPiece>,
    std::equal_to<folly::StringPiece>,
    MemoryLeakCheckerAllocator<std::allocator<std::string>>>;

TEST(StringKeyedUnorderedMapTest, sanity) {
  LeakCheckedUnorderedMap map;
  EXPECT_TRUE(map.empty());
  EXPECT_EQ(map.size(), 0);

  {
    string s("hello");
    StringPiece piece(s, 3);
    map.insert({s, 1});
    EXPECT_FALSE(map.emplace(s, 2).second);
    EXPECT_TRUE(map.emplace(piece, 3).second);
  }

  EXPECT_EQ(map.size(), 2);

  map = static_cast<decltype(map)&>(map); // suppress self-assign warning

  EXPECT_EQ(map.find("hello")->second, 1);
  EXPECT_EQ(map.find("lo")->second, 3);

  map.erase(map.find("hello"));

  EXPECT_EQ(map.size(), 1);

  for (auto& it : map) {
    EXPECT_EQ(it.first, "lo");
  }
}

TEST(StringKeyedUnorderedMapTest, constructors) {
  LeakCheckedUnorderedMap map{
      {"hello", 1},
      {"lo", 3},
  };

  LeakCheckedUnorderedMap map2(map);
  EXPECT_EQ(map2.size(), 2);
  EXPECT_TRUE(map2 == map);

  map2.erase("lo");
  for (auto& it : map2) {
    EXPECT_EQ(it.first, "hello");
  }

  map2.clear();

  EXPECT_TRUE(map2.empty());

  map2.emplace("key1", 1);

  LeakCheckedUnorderedMap map3(std::move(map2));

  EXPECT_EQ(map3.size(), 1);
  EXPECT_EQ(map3["key1"], 1);

  EXPECT_EQ(map3["key0"], 0);
  EXPECT_EQ(map3.size(), 2);

  map3.reserve(1000);

  EXPECT_EQ(map3.size(), 2);

  LeakCheckedUnorderedMap map4{
      {"key0", 0},
      {"key1", 1},
  };

  EXPECT_EQ(map4.erase("key0"), 1);
  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.find("key0"), map4.end());

  map3 = map4;

  EXPECT_EQ(map3.size(), 1);
  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.max_size(), map3.max_size());

  map4 = std::move(map3);

  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.at("key1"), 1);
}

TEST(StringKeyedSetTest, sanity) {
  LeakCheckedSet set;
  EXPECT_TRUE(set.empty());
  EXPECT_EQ(set.size(), 0);

  {
    string s("hello");
    StringPiece piece(s, 3);
    set.insert(s);
    EXPECT_FALSE(set.emplace(s).second);
    EXPECT_TRUE(set.emplace(piece).second);
  }

  EXPECT_EQ(set.size(), 2);

  set = static_cast<decltype(set)&>(set); // suppress self-assign warning

  EXPECT_NE(set.find(StringPiece("hello")), set.end());
  EXPECT_NE(set.find("lo"), set.end());

  auto it = set.begin();
  EXPECT_EQ(*it, "hello");
  EXPECT_EQ(*(++it), "lo");
  EXPECT_EQ(++it, set.end());

  set.erase(set.find("hello"));

  EXPECT_EQ(set.size(), 1);

  for (auto entry : set) {
    EXPECT_EQ(entry, "lo");
  }
}

TEST(StringKeyedSetTest, constructors) {
  LeakCheckedSet set{
      "hello",
      "lo",
  };
  LeakCheckedSet set2(set);

  EXPECT_EQ(set2.size(), 2);

  set2.erase("lo");
  for (auto it : set2) {
    EXPECT_EQ(it, "hello");
  }

  set2.clear();

  EXPECT_TRUE(set2.empty());

  set2.emplace("key1");

  LeakCheckedSet set3(std::move(set2));

  EXPECT_EQ(set3.size(), 1);
  EXPECT_EQ(set3.insert("key1").second, false);

  EXPECT_EQ(set3.emplace("key0").second, true);
  EXPECT_EQ(set3.size(), 2);

  EXPECT_EQ(set3.size(), 2);

  LeakCheckedSet set4{
      "key0",
      "key1",
  };

  EXPECT_EQ(set4.erase("key0"), 1);
  EXPECT_EQ(set4.size(), 1);
  EXPECT_EQ(set4.find("key0"), set4.end());

  set3 = set4;

  EXPECT_EQ(set3.size(), 1);
  EXPECT_EQ(set4.size(), 1);
  EXPECT_EQ(set4.max_size(), set3.max_size());

  set4 = std::move(set3);

  EXPECT_EQ(set4.size(), 1);
  EXPECT_NE(set4.find("key1"), set4.end());
}

TEST(StringKeyedUnorderedSetTest, sanity) {
  LeakCheckedUnorderedSet set;
  EXPECT_TRUE(set.empty());
  EXPECT_EQ(set.size(), 0);

  {
    string s("hello");
    StringPiece piece(s, 3);
    set.insert(s);
    EXPECT_FALSE(set.emplace(s).second);
    EXPECT_TRUE(set.emplace(piece).second);
  }

  EXPECT_EQ(set.size(), 2);

  set = static_cast<decltype(set)&>(set); // suppress self-assign warning

  EXPECT_NE(set.find("hello"), set.end());
  EXPECT_NE(set.find("lo"), set.end());

  set.erase(set.find("hello"));

  EXPECT_EQ(set.size(), 1);

  for (auto entry : set) {
    EXPECT_EQ(entry, "lo");
  }
}

TEST(StringKeyedUnorderedSetTest, constructors) {
  LeakCheckedUnorderedSet s1;
  EXPECT_TRUE(s1.empty());

  LeakCheckedUnorderedSet s2(10);
  EXPECT_TRUE(s2.empty());
  EXPECT_GE(s2.bucket_count(), 10);

  std::list<StringPiece> lst{"abc", "def"};
  LeakCheckedUnorderedSet s3(lst.begin(), lst.end());
  EXPECT_EQ(s3.size(), 2);
  EXPECT_NE(s3.find("abc"), s3.end());
  EXPECT_NE(s3.find("def"), s3.end());
  EXPECT_TRUE(s3 == (LeakCheckedUnorderedSet{"abc", "def"}));

  LeakCheckedUnorderedSet s4(const_cast<LeakCheckedUnorderedSet&>(s3));
  EXPECT_TRUE(s4 == s3);

  LeakCheckedUnorderedSet s5(
      const_cast<LeakCheckedUnorderedSet&>(s3), ValueLeakChecker());
  EXPECT_TRUE(s5 == s3);

  LeakCheckedUnorderedSet s6(std::move(s3));
  EXPECT_TRUE(s3.empty());
  EXPECT_TRUE(s6 == s5);

  auto s6_allocator = s6.get_allocator();
  LeakCheckedUnorderedSet s7(std::move(s6), s6_allocator);
  EXPECT_TRUE(s6.empty());
  EXPECT_TRUE(s7 == s5);

  LeakCheckedUnorderedSet s8{
      "hello",
      "lo",
  };
  EXPECT_EQ(s8.size(), 2);
  EXPECT_NE(s8.find("hello"), s8.end());
  EXPECT_NE(s8.find("lo"), s8.end());

  LeakCheckedUnorderedSet s9(
      {
          "hello",
          "lo",
      },
      10);
  EXPECT_EQ(s9.size(), 2);
  EXPECT_NE(s9.find("hello"), s9.end());
  EXPECT_NE(s9.find("lo"), s9.end());

  LeakCheckedUnorderedSet set2(s8);
  EXPECT_EQ(set2.size(), 2);

  set2.erase("lo");
  for (auto entry : set2) {
    EXPECT_EQ(entry, "hello");
  }

  set2.clear();

  EXPECT_TRUE(set2.empty());

  set2.emplace("key1");

  LeakCheckedUnorderedSet set3(std::move(set2));

  EXPECT_EQ(set3.size(), 1);
  EXPECT_EQ(set3.insert("key1").second, false);

  EXPECT_EQ(set3.emplace("key0").second, true);
  EXPECT_EQ(set3.size(), 2);

  set3.reserve(1000);

  EXPECT_EQ(set3.size(), 2);

  LeakCheckedUnorderedSet set4{
      "key0",
      "key1",
  };

  EXPECT_EQ(set4.erase("key0"), 1);
  EXPECT_EQ(set4.size(), 1);
  EXPECT_EQ(set4.find("key0"), set4.end());

  set3 = set4;

  EXPECT_EQ(set3.size(), 1);
  EXPECT_EQ(set4.size(), 1);
  EXPECT_EQ(set4.max_size(), set3.max_size());

  set4 = std::move(set3);

  EXPECT_EQ(set4.size(), 1);
  EXPECT_NE(set4.find("key1"), set4.end());
}

TEST(StringKeyedMapTest, sanity) {
  LeakCheckedMap map;
  EXPECT_TRUE(map.empty());
  EXPECT_EQ(map.size(), 0);

  {
    string s("hello");
    StringPiece piece(s, 3);
    map.insert({s, 1});
    EXPECT_FALSE(map.emplace(s, 2).second);
    EXPECT_TRUE(map.emplace(piece, 3).second);
  }

  EXPECT_EQ(map.size(), 2);

  map = static_cast<decltype(map)&>(map); // suppress self-assign warning

  EXPECT_EQ(map.find("hello")->second, 1);
  EXPECT_EQ(map.find("lo")->second, 3);

  auto it = map.begin();
  EXPECT_EQ(it->first, "hello");
  EXPECT_EQ((++it)->first, "lo");
  EXPECT_EQ(++it, map.end());

  map.erase(map.find("hello"));

  EXPECT_EQ(map.size(), 1);

  for (auto& entry : map) {
    EXPECT_EQ(entry.first, "lo");
  }
}

TEST(StringKeyedMapTest, constructors) {
  LeakCheckedMap map{
      {"hello", 1},
      {"lo", 3},
  };
  LeakCheckedMap map2(map);

  EXPECT_EQ(map2.size(), 2);

  map2.erase("lo");
  for (auto& entry : map2) {
    EXPECT_EQ(entry.first, "hello");
  }

  map2.clear();

  EXPECT_TRUE(map2.empty());

  map2.emplace("key1", 1);

  LeakCheckedMap map3(std::move(map2));

  EXPECT_EQ(map3.size(), 1);
  EXPECT_EQ(map3["key1"], 1);

  EXPECT_EQ(map3["key0"], 0);
  EXPECT_EQ(map3.size(), 2);

  LeakCheckedMap map4{
      {"key0", 0},
      {"key1", 1},
  };

  EXPECT_EQ(map4.erase("key0"), 1);
  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.find("key0"), map4.end());

  map3 = map4;

  EXPECT_EQ(map3.size(), 1);
  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.max_size(), map3.max_size());

  map4 = std::move(map3);

  EXPECT_EQ(map4.size(), 1);
  EXPECT_EQ(map4.at("key1"), 1);
}

int main(int argc, char** argv) {
  FLAGS_logtostderr = true;
  google::InitGoogleLogging(argv[0]);
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  return RUN_ALL_TESTS();
}

// This MUST be the LAST test.
TEST(StringKeyed, memory_balance) {
  auto balance = allocated < freed ? freed - allocated : allocated - freed;

  LOG(INFO) << "allocated: " << allocated << " freed: " << freed
            << " balance: " << balance
            << (allocated < freed
                    ? " negative (huh?)"
                    : freed < allocated ? " positive (leak)" : "");

  EXPECT_EQ(allocated, freed);
}
