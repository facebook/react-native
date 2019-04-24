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

#include <folly/hash/Hash.h>

#include <stdint.h>

#include <random>
#include <unordered_map>
#include <unordered_set>
#include <utility>

#include <folly/MapUtil.h>
#include <folly/Range.h>
#include <folly/portability/GTest.h>

using namespace folly::hash;

TEST(Hash, Fnv32) {
  const char* s1 = "hello, world!";
  const uint32_t s1_res = 3605494790UL;
  EXPECT_EQ(fnv32(s1), s1_res);
  EXPECT_EQ(fnv32(s1), fnv32_buf(s1, strlen(s1)));

  const char* s2 = "monkeys! m0nk3yz! ev3ry \\/\\/here~~~~";
  const uint32_t s2_res = 1270448334UL;
  EXPECT_EQ(fnv32(s2), s2_res);
  EXPECT_EQ(fnv32(s2), fnv32_buf(s2, strlen(s2)));

  const char* s3 = "";
  const uint32_t s3_res = 2166136261UL;
  EXPECT_EQ(fnv32(s3), s3_res);
  EXPECT_EQ(fnv32(s3), fnv32_buf(s3, strlen(s3)));

  const uint8_t s4_data[] = {0xFF, 0xFF, 0xFF, 0x00};
  const char* s4 = reinterpret_cast<const char*>(s4_data);
  const uint32_t s4_res = 2420936562UL;
  EXPECT_EQ(fnv32(s4), s4_res);
  EXPECT_EQ(fnv32(s4), fnv32_buf(s4, strlen(s4)));
}

TEST(Hash, Fnv64) {
  const char* s1 = "hello, world!";
  const uint64_t s1_res = 13991426986746681734ULL;
  EXPECT_EQ(fnv64(s1), s1_res);
  EXPECT_EQ(fnv64(s1), fnv64_buf(s1, strlen(s1)));

  const char* s2 = "monkeys! m0nk3yz! ev3ry \\/\\/here~~~~";
  const uint64_t s2_res = 6091394665637302478ULL;
  EXPECT_EQ(fnv64(s2), s2_res);
  EXPECT_EQ(fnv64(s2), fnv64_buf(s2, strlen(s2)));

  const char* s3 = "";
  const uint64_t s3_res = 14695981039346656037ULL;
  EXPECT_EQ(fnv64(s3), s3_res);
  EXPECT_EQ(fnv64(s3), fnv64_buf(s3, strlen(s3)));

  const uint8_t s4_data[] = {0xFF, 0xFF, 0xFF, 0x00};
  const char* s4 = reinterpret_cast<const char*>(s4_data);
  const uint64_t s4_res = 2787597222566293202ULL;
  EXPECT_EQ(fnv64(s4), s4_res);
  EXPECT_EQ(fnv64(s4), fnv64_buf(s4, strlen(s4)));

  // note: Use fnv64_buf to make a single hash value from multiple
  // fields/datatypes.
  const char* t4_a = "E Pluribus";
  int64_t t4_b = 0xF1E2D3C4B5A69788;
  int32_t t4_c = 0xAB12CD34;
  const char* t4_d = "Unum";
  uint64_t t4_res = 15571330457339273965ULL;
  uint64_t t4_hash1 = fnv64_buf(t4_a, strlen(t4_a));
  uint64_t t4_hash2 =
      fnv64_buf(reinterpret_cast<void*>(&t4_b), sizeof(int64_t), t4_hash1);
  uint64_t t4_hash3 =
      fnv64_buf(reinterpret_cast<void*>(&t4_c), sizeof(int32_t), t4_hash2);
  uint64_t t4_hash4 = fnv64_buf(t4_d, strlen(t4_d), t4_hash3);
  EXPECT_EQ(t4_hash4, t4_res);
  // note: These are probabalistic, not determinate, but c'mon.
  // These hash values should be different, or something's not
  // working.
  EXPECT_NE(t4_hash1, t4_hash4);
  EXPECT_NE(t4_hash2, t4_hash4);
  EXPECT_NE(t4_hash3, t4_hash4);
}

TEST(Hash, Hsieh32) {
  const char* s1 = "hello, world!";
  const uint32_t s1_res = 2918802987ul;
  EXPECT_EQ(hsieh_hash32(s1), s1_res);
  EXPECT_EQ(hsieh_hash32(s1), hsieh_hash32_buf(s1, strlen(s1)));

  const char* s2 = "monkeys! m0nk3yz! ev3ry \\/\\/here~~~~";
  const uint32_t s2_res = 47373213ul;
  EXPECT_EQ(hsieh_hash32(s2), s2_res);
  EXPECT_EQ(hsieh_hash32(s2), hsieh_hash32_buf(s2, strlen(s2)));

  const char* s3 = "";
  const uint32_t s3_res = 0;
  EXPECT_EQ(hsieh_hash32(s3), s3_res);
  EXPECT_EQ(hsieh_hash32(s3), hsieh_hash32_buf(s3, strlen(s3)));
}

TEST(Hash, TWang_Mix64) {
  uint64_t i1 = 0x78a87873e2d31dafULL;
  uint64_t i1_res = 3389151152926383528ULL;
  EXPECT_EQ(i1_res, twang_mix64(i1));
  EXPECT_EQ(i1, twang_unmix64(i1_res));

  uint64_t i2 = 0x0123456789abcdefULL;
  uint64_t i2_res = 3061460455458984563ull;
  EXPECT_EQ(i2_res, twang_mix64(i2));
  EXPECT_EQ(i2, twang_unmix64(i2_res));
}

namespace {
void checkTWang(uint64_t r) {
  uint64_t result = twang_mix64(r);
  EXPECT_EQ(r, twang_unmix64(result));
}
} // namespace

TEST(Hash, TWang_Unmix64) {
  // We'll try (1 << i), (1 << i) + 1, (1 << i) - 1
  for (int i = 1; i < 64; i++) {
    checkTWang((uint64_t(1) << i) - 1);
    checkTWang(uint64_t(1) << i);
    checkTWang((uint64_t(1) << i) + 1);
  }
}

TEST(Hash, TWang_32From64) {
  uint64_t i1 = 0x78a87873e2d31dafULL;
  uint32_t i1_res = 1525586863ul;
  EXPECT_EQ(twang_32from64(i1), i1_res);

  uint64_t i2 = 0x0123456789abcdefULL;
  uint32_t i2_res = 2918899159ul;
  EXPECT_EQ(twang_32from64(i2), i2_res);
}

TEST(Hash, Jenkins_Rev_Mix32) {
  uint32_t i1 = 3805486511ul;
  uint32_t i1_res = 381808021ul;
  EXPECT_EQ(i1_res, jenkins_rev_mix32(i1));
  EXPECT_EQ(i1, jenkins_rev_unmix32(i1_res));

  uint32_t i2 = 2309737967ul;
  uint32_t i2_res = 1834777923ul;
  EXPECT_EQ(i2_res, jenkins_rev_mix32(i2));
  EXPECT_EQ(i2, jenkins_rev_unmix32(i2_res));
}

namespace {
void checkJenkins(uint32_t r) {
  uint32_t result = jenkins_rev_mix32(r);
  EXPECT_EQ(r, jenkins_rev_unmix32(result));
}
} // namespace

TEST(Hash, Jenkins_Rev_Unmix32) {
  // We'll try (1 << i), (1 << i) + 1, (1 << i) - 1
  for (int i = 1; i < 32; i++) {
    checkJenkins((1U << i) - 1);
    checkJenkins(1U << i);
    checkJenkins((1U << i) + 1);
  }
}

TEST(Hash, hasher) {
  // Basically just confirms that things compile ok.
  std::unordered_map<int32_t, int32_t, folly::hasher<int32_t>> m;
  m.insert(std::make_pair(4, 5));
  EXPECT_EQ(get_default(m, 4), 5);
}

TEST(Hash, integral_types) {
  // Basically just confirms that things compile ok.
  std::unordered_set<size_t> hashes;
  folly::Hash hasher;
  hashes.insert(hasher((char)1));
  hashes.insert(hasher((signed char)2));
  hashes.insert(hasher((unsigned char)3));
  hashes.insert(hasher((short)4));
  hashes.insert(hasher((signed short)5));
  hashes.insert(hasher((unsigned short)6));
  hashes.insert(hasher((int)7));
  hashes.insert(hasher((signed int)8));
  hashes.insert(hasher((unsigned int)9));
  hashes.insert(hasher((long)10));
  hashes.insert(hasher((signed long)11));
  hashes.insert(hasher((unsigned long)12));
  hashes.insert(hasher((long long)13));
  hashes.insert(hasher((signed long long)14));
  hashes.insert(hasher((unsigned long long)15));
  hashes.insert(hasher((int8_t)16));
  hashes.insert(hasher((uint8_t)17));
  hashes.insert(hasher((int16_t)18));
  hashes.insert(hasher((uint16_t)19));
  hashes.insert(hasher((int32_t)20));
  hashes.insert(hasher((uint32_t)21));
  hashes.insert(hasher((int64_t)22));
  hashes.insert(hasher((uint64_t)23));
  hashes.insert(hasher((size_t)24));

  size_t setSize = 24;
#if FOLLY_HAVE_INT128_T
  hashes.insert(hasher((__int128_t)25));
  hashes.insert(hasher((__uint128_t)26));
  setSize += 2;
#endif
  EXPECT_EQ(setSize, hashes.size());
}

namespace {
enum class TestEnum {
  MIN = 0,
  ITEM = 1,
  MAX = 2,
};

enum class TestBigEnum : uint64_t {
  ITEM = 1,
};

struct TestStruct {};
} // namespace

namespace std {
template <>
struct hash<TestEnum> {
  std::size_t operator()(TestEnum const& e) const noexcept {
    return hash<int>()(static_cast<int>(e));
  }
};

template <>
struct hash<TestStruct> {
  std::size_t operator()(TestStruct const&) const noexcept {
    return 0;
  }
};
} // namespace std

namespace {
thread_local size_t allocatedMemorySize{0};

template <class T>
class TestAlloc {
 public:
  using Alloc = std::allocator<T>;
  using value_type = typename Alloc::value_type;

  using pointer = typename Alloc::pointer;
  using const_pointer = typename Alloc::const_pointer;
  using reference = typename Alloc::reference;
  using const_reference = typename Alloc::const_reference;
  using size_type = typename Alloc::size_type;

  using propagate_on_container_swap = std::true_type;
  using propagate_on_container_copy_assignment = std::true_type;
  using propagate_on_container_move_assignment = std::true_type;

  TestAlloc() {}

  template <class T2>
  TestAlloc(TestAlloc<T2> const& other) noexcept : a_(other.a_) {}

  template <class T2>
  TestAlloc& operator=(TestAlloc<T2> const& other) noexcept {
    a_ = other.a_;
    return *this;
  }

  template <class T2>
  TestAlloc(TestAlloc<T2>&& other) noexcept : a_(std::move(other.a_)) {}

  template <class T2>
  TestAlloc& operator=(TestAlloc<T2>&& other) noexcept {
    a_ = std::move(other.a_);
    return *this;
  }

  static size_t getAllocatedMemorySize() {
    return allocatedMemorySize;
  }

  static void resetTracking() {
    allocatedMemorySize = 0;
  }

  T* allocate(size_t n) {
    allocatedMemorySize += n * sizeof(T);
    return a_.allocate(n);
  }
  void deallocate(T* p, size_t n) {
    allocatedMemorySize -= n * sizeof(T);
    a_.deallocate(p, n);
  }

 private:
  std::allocator<T> a_;

  template <class U>
  friend class TestAlloc;
};

template <class T1, class T2>
bool operator==(TestAlloc<T1> const&, TestAlloc<T2> const&) {
  return true;
}

template <class T1, class T2>
bool operator!=(TestAlloc<T1> const&, TestAlloc<T2> const&) {
  return false;
}

template <class M, class A>
std::vector<size_t> getStats(size_t iter) {
  std::vector<size_t> ret;
  ret.reserve(iter);
  A::resetTracking();
  M m;
  ret.push_back(A::getAllocatedMemorySize());
  for (size_t i = 1; i < iter; ++i) {
    m.insert(std::make_pair(
        folly::to<typename M::key_type>(i), typename M::mapped_type{}));
    ret.push_back(A::getAllocatedMemorySize());
  }
  return ret;
}

template <typename K, typename V, typename H>
void testNoCachedHashCode() {
  using A = TestAlloc<std::pair<const K, V>>;
  using M = std::unordered_map<K, V, std::hash<K>, std::equal_to<K>, A>;
  using MActual = std::unordered_map<K, V, H, std::equal_to<K>, A>;
  constexpr int kIter = 10;
  auto expected = getStats<M, A>(kIter);
  auto actual = getStats<MActual, A>(kIter);
  ASSERT_EQ(expected.size(), actual.size());
  for (size_t i = 0; i < expected.size(); ++i) {
    ASSERT_EQ(expected[i], actual[i]);
  }
}
} // namespace

TEST(Hash, noCachedHashCode) {
  testNoCachedHashCode<bool, char, folly::hasher<bool>>();
  testNoCachedHashCode<int, char, folly::hasher<int>>();
  testNoCachedHashCode<double, char, folly::hasher<double>>();
  testNoCachedHashCode<TestEnum, char, folly::hasher<TestEnum>>();

  testNoCachedHashCode<bool, std::string, folly::Hash>();
  testNoCachedHashCode<int, std::string, folly::Hash>();
  testNoCachedHashCode<double, std::string, folly::Hash>();
  testNoCachedHashCode<TestEnum, std::string, folly::Hash>();
}

TEST(Hash, integer_conversion) {
  folly::hasher<uint64_t> h;
  uint64_t k = 10;
  EXPECT_EQ(h(k), h(10));
}

#if FOLLY_HAVE_INT128_T
TEST(Hash, int128_std_hash) {
  std::unordered_set<__int128> hs;
  hs.insert(__int128_t{1});
  hs.insert(__int128_t{2});
  EXPECT_EQ(2, hs.size());

  std::set<unsigned __int128> s;
  s.insert(static_cast<unsigned __int128>(1));
  s.insert(static_cast<unsigned __int128>(2));
  EXPECT_EQ(2, s.size());
}
#endif

TEST(Hash, float_types) {
  folly::Hash hasher;

  EXPECT_EQ(hasher(0.0f), hasher(-0.0f));
  EXPECT_EQ(hasher(0.0), hasher(-0.0));

  // Basically just confirms that things compile ok.
  std::unordered_set<size_t> hashes;
  hashes.insert(hasher(0.0f));
  hashes.insert(hasher(0.1f));
  hashes.insert(hasher(0.2));
  hashes.insert(hasher(0.2f));
  hashes.insert(hasher(-0.3));
  hashes.insert(hasher(-0.3f));

  EXPECT_EQ(6, hashes.size());
}

// Not a full hasher since only handles one type
class TestHasher {
 public:
  size_t operator()(const std::pair<int, int>& p) const {
    return p.first + p.second;
  }
};

template <typename T, typename... Ts>
size_t hash_combine_test(const T& t, const Ts&... ts) {
  return hash_combine_generic(TestHasher{}, t, ts...);
}

TEST(Hash, pair) {
  auto a = std::make_pair(1, 2);
  auto b = std::make_pair(3, 4);
  auto c = std::make_pair(1, 2);
  auto d = std::make_pair(2, 1);
  EXPECT_EQ(hash_combine(a), hash_combine(c));
  EXPECT_NE(hash_combine(b), hash_combine(c));
  EXPECT_NE(hash_combine(d), hash_combine(c));

  // With composition
  EXPECT_EQ(hash_combine(a, b), hash_combine(c, b));
  // Test order dependence
  EXPECT_NE(hash_combine(a, b), hash_combine(b, a));

  // Test with custom hasher
  EXPECT_EQ(hash_combine_test(a), hash_combine_test(c));
  // 3 + 4 != 1 + 2
  EXPECT_NE(hash_combine_test(b), hash_combine_test(c));
  // This time, thanks to a terrible hash function, these are equal
  EXPECT_EQ(hash_combine_test(d), hash_combine_test(c));
  // With composition
  EXPECT_EQ(hash_combine_test(a, b), hash_combine_test(c, b));
  // Test order dependence
  EXPECT_NE(hash_combine_test(a, b), hash_combine_test(b, a));
  // Again, 1 + 2 == 2 + 1
  EXPECT_EQ(hash_combine_test(a, b), hash_combine_test(d, b));
}

TEST(Hash, hash_combine) {
  EXPECT_TRUE(noexcept(hash_combine(1, 2)));
  EXPECT_NE(hash_combine(1, 2), hash_combine(2, 1));
}

TEST(Hash, hash_bool) {
  const auto hash = folly::Hash();
  EXPECT_NE(hash(true), hash(false));
}

TEST(Hash, hash_bool10) {
  const auto hash = folly::Hash();
  std::set<size_t> values;
  for (bool b1 : {false, true}) {
    for (bool b2 : {false, true}) {
      for (bool b3 : {false, true}) {
        for (bool b4 : {false, true}) {
          for (bool b5 : {false, true}) {
            for (bool b6 : {false, true}) {
              for (bool b7 : {false, true}) {
                for (bool b8 : {false, true}) {
                  for (bool b9 : {false, true}) {
                    for (bool b10 : {false, true}) {
                      values.insert(
                          hash(b1, b2, b3, b4, b5, b6, b7, b8, b9, b10));
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  EXPECT_EQ(values.size(), 1 << 10);
}

TEST(Hash, std_tuple) {
  typedef std::tuple<int64_t, std::string, int32_t> tuple3;
  tuple3 t(42, "foo", 1);

  std::unordered_map<tuple3, std::string> m;
  m[t] = "bar";
  EXPECT_EQ("bar", m[t]);
}

TEST(Hash, enum_type) {
  const auto hash = folly::Hash();

  enum class Enum32 : int32_t { Foo, Bar };
  EXPECT_EQ(hash(static_cast<int32_t>(Enum32::Foo)), hash(Enum32::Foo));
  EXPECT_EQ(hash(static_cast<int32_t>(Enum32::Bar)), hash(Enum32::Bar));
  EXPECT_NE(hash(Enum32::Foo), hash(Enum32::Bar));

  std::unordered_map<Enum32, std::string, folly::Hash> m32;
  m32[Enum32::Foo] = "foo";
  EXPECT_EQ("foo", m32[Enum32::Foo]);

  enum class Enum64 : int64_t { Foo, Bar };
  EXPECT_EQ(hash(static_cast<int64_t>(Enum64::Foo)), hash(Enum64::Foo));
  EXPECT_EQ(hash(static_cast<int64_t>(Enum64::Bar)), hash(Enum64::Bar));
  EXPECT_NE(hash(Enum64::Foo), hash(Enum64::Bar));

  std::unordered_map<Enum64, std::string, folly::Hash> m64;
  m64[Enum64::Foo] = "foo";
  EXPECT_EQ("foo", m64[Enum64::Foo]);
}

TEST(Hash, pair_folly_hash) {
  typedef std::pair<int64_t, int32_t> pair2;
  pair2 p(42, 1);

  std::unordered_map<pair2, std::string, folly::Hash> m;
  m[p] = "bar";
  EXPECT_EQ("bar", m[p]);
}

TEST(Hash, tuple_folly_hash) {
  typedef std::tuple<int64_t, int32_t, int32_t> tuple3;
  tuple3 t(42, 1, 1);

  std::unordered_map<tuple3, std::string, folly::Hash> m;
  m[t] = "bar";
  EXPECT_EQ("bar", m[t]);
}

namespace {
template <class T>
size_t hash_vector(const std::vector<T>& v) {
  return hash_range(v.begin(), v.end());
}
} // namespace

TEST(Hash, hash_range) {
  EXPECT_EQ(hash_vector<int32_t>({1, 2}), hash_vector<int16_t>({1, 2}));
  EXPECT_NE(hash_vector<int>({2, 1}), hash_vector<int>({1, 2}));
  EXPECT_EQ(hash_vector<int>({}), hash_vector<float>({}));
}

TEST(Hash, commutative_hash_combine) {
  EXPECT_EQ(
      commutative_hash_combine_value_generic(
          folly::Hash{}(12345ul), folly::Hash{}, 6789ul),
      commutative_hash_combine_value_generic(
          folly::Hash{}(6789ul), folly::Hash{}, 12345ul));

  std::vector<int> v = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
  std::random_device rd;
  std::mt19937 g(rd());
  auto h = commutative_hash_combine_range(v.begin(), v.end());
  for (int i = 0; i < 100; i++) {
    std::shuffle(v.begin(), v.end(), g);
    EXPECT_EQ(h, commutative_hash_combine_range(v.begin(), v.end()));
  }
  EXPECT_NE(
      h,
      commutative_hash_combine_range_generic(
          /* seed = */ 0xdeadbeef, folly::Hash{}, v.begin(), v.end()));
  EXPECT_NE(
      h, commutative_hash_combine_range(v.begin(), v.begin() + (v.size() - 1)));

  EXPECT_EQ(h, commutative_hash_combine(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
  EXPECT_EQ(h, commutative_hash_combine(10, 2, 3, 4, 5, 6, 7, 8, 9, 1));

  EXPECT_EQ(
      commutative_hash_combine(12345, 6789),
      commutative_hash_combine(6789, 12345));
}

TEST(Hash, std_tuple_different_hash) {
  typedef std::tuple<int64_t, std::string, int32_t> tuple3;
  tuple3 t1(42, "foo", 1);
  tuple3 t2(9, "bar", 3);
  tuple3 t3(42, "foo", 3);

  EXPECT_NE(std::hash<tuple3>()(t1), std::hash<tuple3>()(t2));
  EXPECT_NE(std::hash<tuple3>()(t1), std::hash<tuple3>()(t3));
}

TEST(Hash, Strings) {
  using namespace folly;

  StringPiece a1 = "10050517", b1 = "51107032", a2 = "10050518",
              b2 = "51107033", a3 = "10050519", b3 = "51107034",
              a4 = "10050525", b4 = "51107040";
  Range<const wchar_t*> w1 = range(L"10050517"), w2 = range(L"51107032"),
                        w3 = range(L"10050518"), w4 = range(L"51107033");
  Hash h2;
  EXPECT_NE(h2(a1), h2(b1));
  EXPECT_NE(h2(a1), h2(b1));
  EXPECT_NE(h2(a2), h2(b2));
  EXPECT_NE(h2(a3), h2(b3));
  EXPECT_NE(h2(ByteRange(a1)), h2(ByteRange(b1)));
  EXPECT_NE(h2(ByteRange(a2)), h2(ByteRange(b2)));
  EXPECT_NE(h2(ByteRange(a3)), h2(ByteRange(b3)));
  EXPECT_NE(h2(ByteRange(a4)), h2(ByteRange(b4)));
  EXPECT_NE(h2(w1), h2(w2));
  EXPECT_NE(h2(w1), h2(w3));
  EXPECT_NE(h2(w2), h2(w4));

  // Check compatibility with std::string.
  EXPECT_EQ(h2(a1), h2(a1.str()));
  EXPECT_EQ(h2(a2), h2(a2.str()));
  EXPECT_EQ(h2(a3), h2(a3.str()));
  EXPECT_EQ(h2(a4), h2(a4.str()));
}

struct FNVTestParam {
  std::string in;
  uint64_t out;
};

class FNVTest : public ::testing::TestWithParam<FNVTestParam> {};

TEST_P(FNVTest, Fnva64Buf) {
  EXPECT_EQ(
      GetParam().out, fnva64_buf(GetParam().in.data(), GetParam().in.size()));
}

TEST_P(FNVTest, Fnva64) {
  EXPECT_EQ(GetParam().out, fnva64(GetParam().in));
}

TEST_P(FNVTest, Fnva64Partial) {
  size_t partialLen = GetParam().in.size() / 2;
  auto data = GetParam().in.data();
  auto partial = fnva64_buf(data, partialLen);
  EXPECT_EQ(
      GetParam().out,
      fnva64_buf(
          data + partialLen, GetParam().in.size() - partialLen, partial));
}

// Taken from http://www.isthe.com/chongo/src/fnv/test_fnv.c
INSTANTIATE_TEST_CASE_P(
    FNVTesting,
    FNVTest,
    ::testing::Values(
        FNVTestParam{"foobar", // 11
                     0x85944171f73967e8},
        FNVTestParam{"chongo was here!\n", // 39
                     0x46810940eff5f915},
        FNVTestParam{"127.0.0.3", // 106,
                     0xaabafc7104d91158},
        FNVTestParam{"http://en.wikipedia.org/wiki/Fowler_Noll_Vo_hash", // 126
                     0xd9b957fb7fe794c5},
        FNVTestParam{"http://norvig.com/21-days.html", // 136
                     0x07aaa640476e0b9a}));

//////// static checks

static constexpr bool k32Bit = sizeof(std::size_t) == 4;

static_assert(!folly::IsAvalanchingHasher<std::hash<int>, int>::value, "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<char const*>, char const*>::value,
    "");
static_assert(!folly::IsAvalanchingHasher<std::hash<float>, float>::value, "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<double>, double>::value,
    "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<long double>, long double>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<std::hash<std::string>, std::string>::value,
    "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<TestEnum>, TestEnum>::value,
    "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<TestStruct>, TestStruct>::value,
    "");

static_assert(
    !folly::IsAvalanchingHasher<folly::transparent<std::hash<int>>, int>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::transparent<std::hash<std::string>>,
        std::string>::value,
    "");

// these come from folly/hash/Hash.h
static_assert(
    folly::IsAvalanchingHasher<
        std::hash<std::pair<int, int>>,
        std::pair<int, int>>::value,
    "");
static_assert(
    !folly::IsAvalanchingHasher<std::hash<std::tuple<int>>, std::tuple<int>>::
        value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        std::hash<std::tuple<std::string>>,
        std::tuple<std::string>>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        std::hash<std::tuple<int, int>>,
        std::tuple<int, int>>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        std::hash<std::tuple<int, int, int>>,
        std::tuple<int, int, int>>::value,
    "");

static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, uint8_t>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, char>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, uint16_t>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, int16_t>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, uint32_t>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, int32_t>::value,
    "");
static_assert(folly::IsAvalanchingHasher<folly::Hash, uint64_t>::value, "");
static_assert(folly::IsAvalanchingHasher<folly::Hash, int64_t>::value, "");
static_assert(
    folly::IsAvalanchingHasher<folly::Hash, folly::StringPiece>::value,
    "");
static_assert(folly::IsAvalanchingHasher<folly::Hash, std::string>::value, "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::Hash, TestEnum>::value,
    "");
static_assert(folly::IsAvalanchingHasher<folly::Hash, TestBigEnum>::value, "");

static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<uint8_t>, uint8_t>::value,
    "");
static_assert(
    k32Bit == folly::IsAvalanchingHasher<folly::hasher<char>, char>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<uint16_t>, uint16_t>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<int16_t>, int16_t>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<uint32_t>, uint32_t>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<int32_t>, int32_t>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<uint64_t>, uint64_t>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<int64_t>, int64_t>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<float>, float>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<double>, double>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<std::string>, std::string>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<folly::StringPiece>, std::string>::
        value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::hasher<folly::StringPiece>,
        folly::StringPiece>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::transparent<folly::hasher<folly::StringPiece>>,
        folly::StringPiece>::value,
    "");

static_assert(
    folly::IsAvalanchingHasher<folly::hasher<std::string>, std::string>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::hasher<std::pair<int, int>>,
        std::pair<int, int>>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<
            folly::hasher<std::tuple<int>>,
            std::tuple<int>>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::hasher<std::tuple<std::string>>,
        std::tuple<std::string>>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::hasher<std::tuple<int, int>>,
        std::tuple<int, int>>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<
        folly::hasher<std::tuple<int, int, int>>,
        std::tuple<int, int, int>>::value,
    "");
static_assert(
    k32Bit ==
        folly::IsAvalanchingHasher<folly::hasher<TestEnum>, TestEnum>::value,
    "");
static_assert(
    folly::IsAvalanchingHasher<folly::hasher<TestBigEnum>, TestBigEnum>::value,
    "");

//////// dynamic checks

namespace {
template <typename H, typename T, typename F>
void verifyAvalanching(T initialValue, F const& advance) {
  // This doesn't check probabilities, but does verify that every bit
  // changed independently of every other bit, in both directions, when
  // traversing a sequence of dependent changes.  Note that it is NOT
  // sufficient to just use a random sequence here, because even the
  // identity function will pass.  As constructed this will require
  // 2^63 steps to complete for an identity hash, because none of the
  // transitions with on == 63 will occur until then.
  H const hasher;
  constexpr std::size_t N = sizeof(decltype(hasher(initialValue))) * 8;

  // seen[i][j] if we have seen i flip on at the same time as j went off
  bool seen[N][N] = {};
  std::size_t unseenCount = N * (N - 1);
  auto v = initialValue;
  auto h = hasher(v);
  std::size_t steps = 0;
  // wait for 95% coverage
  while (unseenCount > (N * (N - 1)) / 95) {
    ++steps;
    auto hPrev = h;
    advance(v);
    h = hasher(v);

    uint64_t delta = hPrev ^ h;
    for (std::size_t i = 0; i < N - 1; ++i) {
      if (((delta >> i) & 1) == 0) {
        continue;
      }
      // we know i flipped
      for (std::size_t j = i + 1; j < N; ++j) {
        if (((delta >> j) & 1) == 0) {
          continue;
        }
        // we know j flipped
        bool iOn = ((hPrev >> i) & 1) == 0;
        bool jOn = ((hPrev >> j) & 1) == 0;
        if (iOn != jOn) {
          auto on = iOn ? i : j;
          auto off = iOn ? j : i;
          if (!seen[on][off]) {
            seen[on][off] = true;
            --unseenCount;
          }
        }
      }
    }

    // we should actually only need a couple hundred
    ASSERT_LT(steps, 1000) << unseenCount << " of " << (N * (N - 1))
                           << " pair transitions unseen";
  }
}
} // namespace

TEST(Traits, stdHashPairAvalances) {
  verifyAvalanching<std::hash<std::pair<int, int>>>(
      std::make_pair(0, 0), [](std::pair<int, int>& v) { v.first++; });
}

TEST(Traits, stdHashTuple2Avalances) {
  verifyAvalanching<std::hash<std::tuple<int, int>>>(
      std::make_tuple(0, 0),
      [](std::tuple<int, int>& v) { std::get<0>(v) += 1; });
}

TEST(Traits, stdHashStringAvalances) {
  verifyAvalanching<std::hash<std::string>, std::string>(
      "00000000000000000000000000000", [](std::string& str) {
        std::size_t i = 0;
        while (str[i] == '1') {
          str[i] = '0';
          ++i;
        }
        str[i] = '1';
      });
}

TEST(Traits, follyHashUint64Avalances) {
  verifyAvalanching<folly::Hash>(uint64_t{0}, [](uint64_t& v) { v++; });
}

TEST(Traits, follyHasherInt64Avalances) {
  verifyAvalanching<folly::hasher<int64_t>>(
      int64_t{0}, [](int64_t& v) { v++; });
}

TEST(Traits, follyHasherFloatAvalanches) {
  verifyAvalanching<folly::hasher<float>>(0.0f, [](float& v) { v += 1; });
}

TEST(Traits, follyHasherDoubleAvalanches) {
  verifyAvalanching<folly::hasher<double>>(0.0, [](double& v) { v += 1; });
}
