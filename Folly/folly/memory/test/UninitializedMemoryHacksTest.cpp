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

#include <folly/memory/UninitializedMemoryHacks.h>

#include <algorithm>
#include <string>
#include <vector>

#include <folly/Memory.h>
#include <folly/Random.h>
#include <folly/portability/GTest.h>
#include <glog/logging.h>

void describePlatform() {
  LOG(INFO) << "sizeof(void*) = " << sizeof(void*);

  LOG(INFO) << "sizeof(std::string) = " << sizeof(std::string);
#if defined(_LIBCPP_STRING)
  LOG(INFO) << "std::string from libc++";
#elif defined(_STLP_STRING)
  LOG(INFO) << "std::string from STLport";
#elif defined(_GLIBCXX_USE_FB)
  LOG(INFO) << "std::string from FBString";
#elif defined(_GLIBCXX_STRING) && _GLIBCXX_USE_CXX11_ABI
  LOG(INFO) << "std::string from libstdc++ with SSO";
#elif defined(_GLIBCXX_STRING)
  LOG(INFO) << "std::string from old libstdc++";
#elif defined(_MSC_VER)
  LOG(INFO) << "std::string from MSVC";
#else
  LOG(INFO) << "UNKNOWN std::string implementation";
#endif

  LOG(INFO) << "sizeof(std::vector<char>) = " << sizeof(std::vector<char>);
#if defined(_LIBCPP_VECTOR)
  LOG(INFO) << "std::vector from libc++";
#elif defined(_STLP_VECTOR)
  LOG(INFO) << "std::vector from STLport";
#elif defined(_GLIBCXX_VECTOR)
  LOG(INFO) << "std::vector from libstdc++";
#elif defined(_MSC_VER)
  LOG(INFO) << "std::vector from MSVC";
#else
  LOG(INFO) << "UNKNOWN std::vector implementation";
#endif
}

// Returns a concatenation of target[i] for those i where valid[i]
template <typename T>
T validData(T const& target, std::vector<bool> const& valid) {
  EXPECT_EQ(target.size(), valid.size());
  T rv;
  for (std::size_t i = 0; i < valid.size(); ++i) {
    if (valid[i]) {
      rv.push_back(target[i]);
    }
  }
  return rv;
}

template <typename T>
void doResizeWithoutInit(
    T& target,
    std::vector<bool>& valid,
    std::size_t newSize) {
  auto oldSize = target.size();
  auto before = validData(target, valid);
  folly::resizeWithoutInitialization(target, newSize);
  valid.resize(newSize);
  auto after = validData(target, valid);
  if (oldSize <= newSize) {
    EXPECT_EQ(before, after);
  } else {
    EXPECT_GE(before.size(), after.size());
    EXPECT_TRUE(std::equal(after.begin(), after.end(), before.begin()));
  }
}

template <typename T>
void doOverwrite(
    T& target,
    std::vector<bool>& valid,
    std::size_t b,
    std::size_t e) {
  for (auto i = b; i < e && i < target.size(); ++i) {
    target[i] = '0' + (i % 10);
    valid[i] = true;
  }
}

template <typename T>
void doResize(T& target, std::vector<bool>& valid, std::size_t newSize) {
  auto oldSize = target.size();
  auto before = validData(target, valid);
  target.resize(newSize);
  valid.resize(newSize);
  for (auto i = oldSize; i < newSize; ++i) {
    valid[i] = true;
  }
  auto after = validData(target, valid);
  if (oldSize == newSize) {
    EXPECT_EQ(before, after);
  } else if (oldSize < newSize) {
    EXPECT_LT(before.size(), after.size());
    EXPECT_TRUE(std::equal(before.begin(), before.end(), after.begin()));
  } else {
    EXPECT_GE(before.size(), after.size());
    EXPECT_TRUE(std::equal(after.begin(), after.end(), before.begin()));
  }
}

template <typename T>
void doClear(T& target, std::vector<bool>& valid) {
  target.clear();
  valid.clear();
}

template <typename T>
void doInsert(T& target, std::vector<bool>& valid, std::size_t i) {
  target.insert(target.begin() + i, 'I');
  valid.insert(valid.begin() + i, true);
}

template <typename T>
void doErase(T& target, std::vector<bool>& valid, std::size_t i) {
  target.erase(target.begin() + i);
  valid.erase(valid.begin() + i);
}

template <typename T>
void doPushBack(T& target, std::vector<bool>& valid) {
  target.push_back('P');
  valid.push_back(true);
}

template <typename T>
void genericCheck(T& target) {
  EXPECT_LE(target.size(), target.capacity());
  EXPECT_EQ(target.size() == 0, target.empty());
  EXPECT_EQ(target.size(), target.end() - target.begin());
  EXPECT_EQ(target.size(), target.cend() - target.cbegin());
  if (!target.empty()) {
    EXPECT_EQ(target.data(), &target[0]);
    EXPECT_EQ(target.data(), &target.front());
    EXPECT_EQ(target.data() + target.size() - 1, &target.back());
  }
}

template <typename T>
void check(T& target) {
  genericCheck(target);
}

template <>
void check<std::string>(std::string& target) {
  genericCheck(target);
  EXPECT_EQ(target.c_str(), target.data());
  EXPECT_EQ(target.c_str()[target.size()], '\0');
}

template <typename T>
void testSimple() {
  describePlatform();

  auto sizes = {0, 1, 10, 14, 15, 16, 17, 22, 23, 24, 32, 95, 100, 10000};
  for (auto i : sizes) {
    for (auto j : sizes) {
      {
        T target;
        std::vector<bool> valid;
        doResize(target, valid, i);
        doResizeWithoutInit(target, valid, j);
        check(target);
      }

      {
        T target;
        std::vector<bool> valid;
        doResize(target, valid, i);
        doResizeWithoutInit(target, valid, j);
        doOverwrite(target, valid, i, j);
        check(target);
      }

      {
        T target;
        std::vector<bool> valid;
        doResizeWithoutInit(target, valid, i);
        doResize(target, valid, j);
        doOverwrite(target, valid, i / 2, i / 2);
        check(target);
      }

      {
        T target;
        std::vector<bool> valid;
        doResizeWithoutInit(target, valid, i);
        doResize(target, valid, j);
        doOverwrite(target, valid, i, j);
        check(target);
      }
    }
  }
}

template <typename T>
void testRandom(size_t numSteps = 10000) {
  describePlatform();

  auto target = folly::make_unique<T>();
  std::vector<bool> valid;

  for (size_t step = 0; step < numSteps; ++step) {
    auto pct = folly::Random::rand32(100);
    auto v = folly::Random::rand32(uint32_t{3} << folly::Random::rand32(14));

    if (pct < 5) {
      doClear(*target, valid);
    } else if (pct < 30) {
      T copy;
      folly::resizeWithoutInitialization(copy, target->size());
      for (size_t i = 0; i < copy.size(); ++i) {
        if (valid[i]) {
          copy[i] = target->at(i);
        }
      }
      if (pct < 10) {
        std::swap(copy, *target);
      } else if (pct < 15) {
        *target = std::move(copy);
      } else if (pct < 20) {
        *target = copy;
      } else if (pct < 25) {
        target = folly::make_unique<T>(std::move(copy));
      } else {
        target = folly::make_unique<T>(copy);
      }
    } else if (pct < 35) {
      target->reserve(v);
    } else if (pct < 40) {
      target->shrink_to_fit();
    } else if (pct < 45) {
      doResize(*target, valid, v);
    } else if (pct < 50) {
      doInsert(*target, valid, v % (target->size() + 1));
    } else if (pct < 55) {
      if (!target->empty()) {
        doErase(*target, valid, v % target->size());
      }
    } else if (pct < 60) {
      doPushBack(*target, valid);
    } else if (pct < 65) {
      target = folly::make_unique<T>();
      valid.clear();
    } else if (pct < 80) {
      auto v2 = folly::Random::rand32(uint32_t{3} << folly::Random::rand32(14));
      doOverwrite(*target, valid, std::min(v, v2), std::max(v, v2));
    } else {
      doResizeWithoutInit(*target, valid, v);
    }

    // don't check every time in implementation does lazy work
    if (folly::Random::rand32(100) < 50) {
      check(*target);
    }
  }
}

TEST(UninitializedMemoryHacks, simpleString) {
  testSimple<std::string>();
}

TEST(UninitializedMemoryHacks, simpleVectorChar) {
  testSimple<std::vector<char>>();
}

TEST(UninitializedMemoryHacks, simpleVectorByte) {
  testSimple<std::vector<uint8_t>>();
}

TEST(UninitializedMemoryHacks, simpleVectorInt) {
  testSimple<std::vector<int>>();
}

TEST(UninitializedMemoryHacks, randomString) {
  testRandom<std::string>();
}

TEST(UninitializedMemoryHacks, randomVectorChar) {
  testRandom<std::vector<char>>();
}

TEST(UninitializedMemoryHacks, randomVectorByte) {
  testRandom<std::vector<uint8_t>>();
}

TEST(UninitializedMemoryHacks, randomVectorInt) {
  testRandom<std::vector<int>>();
}

// We are deliberately putting this at the bottom to make sure it can follow use
FOLLY_DECLARE_VECTOR_RESIZE_WITHOUT_INIT(int)
