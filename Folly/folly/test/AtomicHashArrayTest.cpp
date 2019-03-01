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

#include <cstddef>
#include <map>
#include <stdexcept>

#include <folly/AtomicHashArray.h>
#include <folly/Conv.h>
#include <folly/Hash.h>
#include <folly/Memory.h>
#include <folly/portability/SysMman.h>
#include <folly/portability/GTest.h>

using namespace std;
using namespace folly;

template <class T>
class MmapAllocator {
 public:
  typedef T value_type;
  typedef T* pointer;
  typedef const T* const_pointer;
  typedef T& reference;
  typedef const T& const_reference;

  typedef ptrdiff_t difference_type;
  typedef size_t size_type;

  T* address(T& x) const {
    return std::addressof(x);
  }

  const T* address(const T& x) const {
    return std::addressof(x);
  }

  size_t max_size() const {
    return std::numeric_limits<size_t>::max();
  }

  template <class U> struct rebind {
    typedef MmapAllocator<U> other;
  };

  bool operator!=(const MmapAllocator<T>& other) const {
    return !(*this == other);
  }

  bool operator==(const MmapAllocator<T>& /* other */) const { return true; }

  template <class... Args>
  void construct(T* p, Args&&... args) {
    new (p) T(std::forward<Args>(args)...);
  }

  void destroy(T* p) {
    p->~T();
  }

  T *allocate(size_t n) {
    void *p = mmap(nullptr, n * sizeof(T), PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (p == MAP_FAILED) throw std::bad_alloc();
    return (T *)p;
  }

  void deallocate(T *p, size_t n) {
    munmap(p, n * sizeof(T));
  }
};

template<class KeyT, class ValueT>
pair<KeyT,ValueT> createEntry(int i) {
  return pair<KeyT,ValueT>(to<KeyT>(folly::hash::jenkins_rev_mix32(i) % 1000),
                           to<ValueT>(i + 3));
}

template <class KeyT,
          class ValueT,
          class Allocator = std::allocator<char>,
          class ProbeFcn = AtomicHashArrayLinearProbeFcn>
void testMap() {
  typedef AtomicHashArray<KeyT, ValueT, std::hash<KeyT>,
                          std::equal_to<KeyT>, Allocator, ProbeFcn> MyArr;
  auto arr = MyArr::create(150);
  map<KeyT, ValueT> ref;
  for (int i = 0; i < 100; ++i) {
    auto e = createEntry<KeyT, ValueT>(i);
    auto ret = arr->insert(e);
    EXPECT_EQ(!ref.count(e.first), ret.second);  // succeed iff not in ref
    ref.insert(e);
    EXPECT_EQ(ref.size(), arr->size());
    if (ret.first == arr->end()) {
      EXPECT_FALSE("AHA should not have run out of space.");
      continue;
    }
    EXPECT_EQ(e.first, ret.first->first);
    EXPECT_EQ(ref.find(e.first)->second, ret.first->second);
  }

  for (int i = 125; i > 0; i -= 10) {
    auto e = createEntry<KeyT, ValueT>(i);
    auto ret = arr->erase(e.first);
    auto refRet = ref.erase(e.first);
    EXPECT_EQ(ref.size(), arr->size());
    EXPECT_EQ(refRet, ret);
  }

  for (int i = 155; i > 0; i -= 10) {
    auto e = createEntry<KeyT, ValueT>(i);
    auto ret = arr->insert(e);
    auto refRet = ref.insert(e);
    EXPECT_EQ(ref.size(), arr->size());
    EXPECT_EQ(*refRet.first, *ret.first);
    EXPECT_EQ(refRet.second, ret.second);
  }

  for (const auto& e : ref) {
    auto ret = arr->find(e.first);
    if (ret == arr->end()) {
      EXPECT_FALSE("Key was not in AHA");
      continue;
    }
    EXPECT_EQ(e.first, ret->first);
    EXPECT_EQ(e.second, ret->second);
  }
}

template<class KeyT, class ValueT,
    class Allocator = std::allocator<char>,
    class ProbeFcn = AtomicHashArrayLinearProbeFcn>
void testNoncopyableMap() {
  typedef AtomicHashArray<KeyT, std::unique_ptr<ValueT>, std::hash<KeyT>,
                          std::equal_to<KeyT>, Allocator, ProbeFcn> MyArr;

  auto arr = MyArr::create(250);
  for (int i = 0; i < 100; i++) {
    arr->insert(make_pair(i,std::unique_ptr<ValueT>(new ValueT(i))));
  }
  for (int i = 100; i < 150; i++) {
    arr->emplace(i,new ValueT(i));
  }
  for (int i = 150; i < 200; i++) {
    arr->emplace(i,new ValueT(i),std::default_delete<ValueT>());
  }
  for (int i = 0; i < 200; i++) {
    auto ret = arr->find(i);
    EXPECT_EQ(*(ret->second), i);
  }
}


TEST(Aha, InsertErase_i32_i32) {
  testMap<int32_t, int32_t>();
  testMap<int32_t, int32_t, MmapAllocator<char>>();
  testMap<int32_t, int32_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int32_t, int32_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int32_t, int32_t>();
  testNoncopyableMap<int32_t, int32_t, MmapAllocator<char>>();
  testNoncopyableMap<int32_t, int32_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int32_t, int32_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}
TEST(Aha, InsertErase_i64_i32) {
  testMap<int64_t, int32_t>();
  testMap<int64_t, int32_t, MmapAllocator<char>>();
  testMap<int64_t, int32_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int64_t, int32_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int64_t, int32_t>();
  testNoncopyableMap<int64_t, int32_t, MmapAllocator<char>>();
  testNoncopyableMap<int64_t, int32_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int64_t, int32_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}
TEST(Aha, InsertErase_i64_i64) {
  testMap<int64_t, int64_t>();
  testMap<int64_t, int64_t, MmapAllocator<char>>();
  testMap<int64_t, int64_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int64_t, int64_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int64_t, int64_t>();
  testNoncopyableMap<int64_t, int64_t, MmapAllocator<char>>();
  testNoncopyableMap<int64_t, int64_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int64_t, int64_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}
TEST(Aha, InsertErase_i32_i64) {
  testMap<int32_t, int64_t>();
  testMap<int32_t, int64_t, MmapAllocator<char>>();
  testMap<int32_t, int64_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int32_t, int64_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int32_t, int64_t>();
  testNoncopyableMap<int32_t, int64_t, MmapAllocator<char>>();
  testNoncopyableMap<int32_t, int64_t,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testNoncopyableMap<int32_t, int64_t,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}
TEST(Aha, InsertErase_i32_str) {
  testMap<int32_t, string>();
  testMap<int32_t, string, MmapAllocator<char>>();
  testMap<int32_t, string,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int32_t, string,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}
TEST(Aha, InsertErase_i64_str) {
  testMap<int64_t, string>();
  testMap<int64_t, string, MmapAllocator<char>>();
  testMap<int64_t, string,
      std::allocator<char>, AtomicHashArrayQuadraticProbeFcn>();
  testMap<int64_t, string,
      MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn>();
}

TEST(Aha, Create_cstr_i64) {
  auto obj = AtomicHashArray<const char*, int64_t>::create(12);
}

static bool legalKey(char* a);

// Support two additional key lookup types (char and StringPiece) using
// one set of traits.
struct EqTraits {
  bool operator()(char* a, char* b) {
    return legalKey(a) && (strcmp(a, b) == 0);
  }
  bool operator()(char* a, const char& b) {
    return legalKey(a) && (a[0] != '\0') && (a[0] == b);
  }
  bool operator()(char* a, const StringPiece b) {
    return legalKey(a) &&
      (strlen(a) == b.size()) && (strncmp(a, b.begin(), b.size()) == 0);
  }
};

struct HashTraits {
  size_t operator()(char* a) {
    size_t result = 0;
    while (a[0] != 0) result += static_cast<size_t>(*(a++));
    return result;
  }
  size_t operator()(const char& a) {
    return static_cast<size_t>(a);
  }
  size_t operator()(const StringPiece a) {
    size_t result = 0;
    for (const auto& ch : a) result += static_cast<size_t>(ch);
    return result;
  }
};

// Creates malloc'ed null-terminated strings.
struct KeyConvertTraits {
  char* operator()(const char& a) {
    return strndup(&a, 1);
  }
  char* operator()(const StringPiece a) {
    return strndup(a.begin(), a.size());
  }
};

typedef AtomicHashArray<char*, int64_t, HashTraits, EqTraits,
                        MmapAllocator<char>, AtomicHashArrayQuadraticProbeFcn,
                        KeyConvertTraits>
  AHACstrInt;
AHACstrInt::Config cstrIntCfg;

static bool legalKey(char* a) {
  return a != cstrIntCfg.emptyKey &&
    a != cstrIntCfg.lockedKey &&
    a != cstrIntCfg.erasedKey;
}

TEST(Aha, LookupAny) {
  auto arr = AHACstrInt::create(12);

  char* f_char = strdup("f");
  SCOPE_EXIT { free(f_char); };
  arr->insert(std::make_pair(f_char, 42));

  EXPECT_EQ(42, arr->find("f")->second);
  {
    // Look up a single char, successfully.
    auto it = arr->find('f');
    EXPECT_EQ(42, it->second);
  }
  {
    // Look up a single char, unsuccessfully.
    auto it = arr->find('g');
    EXPECT_TRUE(it == arr->end());
  }
  {
    // Insert a new char key.
    auto res = arr->emplace('h', static_cast<int64_t>(123));
    EXPECT_TRUE(res.second);
    EXPECT_TRUE(res.first != arr->end());
    // Look up the string version.
    EXPECT_EQ(123, arr->find("h")->second);
  }
  {
    // Fail to emplace an existing key.
    auto res = arr->emplace('f', static_cast<int64_t>(123));
    EXPECT_FALSE(res.second);
    EXPECT_TRUE(res.first != arr->end());
  }

  for (auto it : *arr) {
    free(it.first);
  }
}

using AHAIntCInt = AtomicHashArray<int64_t, const int32_t>;

TEST(Aha, ConstValue) {
  auto aha = AHAIntCInt::create(10);
  aha->emplace(1, 2);
}
