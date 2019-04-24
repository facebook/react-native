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

#include <functional>
#include <iostream>
#include <limits>
#include <memory>
#include <string>
#include <unordered_map>
#include <utility>

#include <folly/container/F14Map.h>

using namespace std;
using namespace folly;

template <typename T>
struct LoggingAlloc {
  using value_type = T;

  LoggingAlloc() {}

  template <typename A>
  explicit LoggingAlloc(A&&) {}

  T* allocate(std::size_t n) {
    cout << "allocate " << n << " values, " << n * sizeof(T) << " bytes\n";
    return std::allocator<T>{}.allocate(n);
  }

  void deallocate(T* ptr, std::size_t n) {
    cout << "deallocate " << n << " values, " << n * sizeof(T) << " bytes\n";
    std::allocator<T>{}.deallocate(ptr, n);
  }

  bool operator==(LoggingAlloc<T> const&) const {
    return true;
  }
  bool operator!=(LoggingAlloc<T> const&) const {
    return false;
  }

  // Everything below here is optional when properly using
  // allocator_traits, but dense_hash_map doesn't use allocator_traits yet

  using pointer = T*;
  using const_pointer = T const*;
  using reference = T&;
  using const_reference = T const&;
  using size_type = std::size_t;
  using difference_type = std::ptrdiff_t;

  template <typename U>
  struct rebind {
    using other = LoggingAlloc<U>;
  };

  T* address(T& v) const {
    return &v;
  }
  T const* address(T const& v) const {
    return &v;
  }
  std::size_t max_size() const {
    return std::numeric_limits<std::size_t>::max();
  }
};

template <typename K, typename V, template <typename> class A>
using StdUnorderedMapTable = std::unordered_map<
    K,
    V,
    std::hash<K>,
    std::equal_to<K>,
    A<std::pair<K const, V>>>;

template <typename K, typename V, template <typename> class A>
using F14ValueMapTable =
    F14ValueMap<K, V, std::hash<K>, std::equal_to<K>, A<std::pair<K const, V>>>;

template <typename K, typename V, template <typename> class A>
using F14NodeMapTable =
    F14NodeMap<K, V, std::hash<K>, std::equal_to<K>, A<std::pair<K const, V>>>;

template <typename K, typename V, template <typename> class A>
using F14VectorMapTable = F14VectorMap<
    K,
    V,
    std::hash<K>,
    std::equal_to<K>,
    A<std::pair<K const, V>>>;

template <typename M>
void runSingleInsert(std::string const& name) {
  cout << "----------------------\n";
  cout << name << "\n";
  cout << "SIZE = " << sizeof(M) << "\n";
  cout << "CONSTRUCTING\n";
  {
    M map;
    cout << "INSERTING 1 VALUE\n";
    typename M::key_type k{};
    map[k];
    cout << "DESTROYING\n";
  }
  cout << "\n";
}

template <template <typename, typename, template <typename> class> class T>
void runSingleInserts(std::string const& name) {
  runSingleInsert<T<uint64_t, array<char, 8>, LoggingAlloc>>(
      name + " uint64_t 8");
  runSingleInsert<T<string, array<char, 8>, LoggingAlloc>>(name + " string 8");
  runSingleInsert<T<uint64_t, array<char, 128>, LoggingAlloc>>(
      name + " uint64_t 128");
  runSingleInsert<T<string, array<char, 128>, LoggingAlloc>>(
      name + " string 128");
}

FOLLY_NOINLINE int codeSize_find_Std(
    std::unordered_map<int16_t, float>& m,
    int16_t k) {
  auto i = m.find(k);
  return i != m.end() ? 1 : 0;
}

FOLLY_NOINLINE int codeSize_find_F14Value(
    F14ValueMap<int16_t, float>& m,
    int16_t k) {
  auto i = m.find(k);
  return i != m.end() ? 1 : 0;
}

FOLLY_NOINLINE int codeSize_find_F14Node(
    F14NodeMap<int16_t, float>& m,
    int16_t k) {
  auto i = m.find(k);
  return i != m.end() ? 1 : 0;
}

FOLLY_NOINLINE int codeSize_find_F14Vector(
    F14VectorMap<int16_t, float>& m,
    int16_t k) {
  auto i = m.find(k);
  return i != m.end() ? 1 : 0;
}

FOLLY_NOINLINE void codeSize_bracket_Std(
    std::unordered_map<int16_t, uint32_t>& m,
    int16_t k,
    uint32_t v) {
  m[k] = v;
}

FOLLY_NOINLINE void codeSize_bracket_F14Value(
    F14ValueMap<int16_t, uint32_t>& m,
    int16_t k,
    uint32_t v) {
  m[k] = v;
}

FOLLY_NOINLINE void codeSize_bracket_F14Node(
    F14NodeMap<int16_t, uint32_t>& m,
    int16_t k,
    uint32_t v) {
  m[k] = v;
}

FOLLY_NOINLINE void codeSize_bracket_F14Vector(
    F14VectorMap<int16_t, uint32_t>& m,
    int16_t k,
    uint32_t v) {
  m[k] = v;
}

FOLLY_NOINLINE void codeSize_erase_Std(
    std::unordered_map<int16_t, uint32_t>& m,
    std::unordered_map<int16_t, uint32_t>::iterator iter) {
  m.erase(iter);
}

FOLLY_NOINLINE void codeSize_erase_F14Value(
    F14ValueMap<int16_t, uint32_t>& m,
    F14ValueMap<int16_t, uint32_t>::iterator iter) {
  m.erase(iter);
}

FOLLY_NOINLINE void codeSize_erase_F14Node(
    F14NodeMap<int16_t, uint32_t>& m,
    F14NodeMap<int16_t, uint32_t>::iterator iter) {
  m.erase(iter);
}

FOLLY_NOINLINE void codeSize_erase_F14Vector(
    F14VectorMap<int16_t, uint32_t>& m,
    F14VectorMap<int16_t, uint32_t>::iterator iter) {
  m.erase(iter);
}

int main(int, char**) {
  (void)codeSize_find_Std;
  (void)codeSize_find_F14Value;
  (void)codeSize_find_F14Node;
  (void)codeSize_find_F14Vector;

  (void)codeSize_bracket_Std;
  (void)codeSize_bracket_F14Value;
  (void)codeSize_bracket_F14Node;
  (void)codeSize_bracket_F14Vector;

  (void)codeSize_erase_Std;
  (void)codeSize_erase_F14Value;
  (void)codeSize_erase_F14Node;
  (void)codeSize_erase_F14Vector;

  runSingleInserts<StdUnorderedMapTable>("std");
  runSingleInserts<F14ValueMapTable>("f14value");
  runSingleInserts<F14NodeMapTable>("f14node");
  runSingleInserts<F14VectorMapTable>("f14vector");

  return 0;
}
