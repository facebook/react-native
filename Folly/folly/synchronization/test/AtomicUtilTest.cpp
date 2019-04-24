/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/synchronization/AtomicUtil.h>

#include <folly/Benchmark.h>
#include <folly/Portability.h>
#include <folly/Utility.h>
#include <folly/portability/GTest.h>

namespace folly {

namespace {
auto default_fetch_set = [](auto&&... args) {
  return atomic_fetch_set(args...);
};
auto default_fetch_reset = [](auto&&... args) {
  return atomic_fetch_reset(args...);
};

template <typename Integer, typename FetchSet = decltype(default_fetch_set)>
void atomic_fetch_set_basic(FetchSet fetch_set = default_fetch_set) {
  {
    auto&& atomic = std::atomic<Integer>{0};
    EXPECT_EQ(fetch_set(atomic, 0), false);
    EXPECT_EQ(fetch_set(atomic, 1), false);
    EXPECT_EQ(atomic.load(), 0b11);
    EXPECT_EQ(fetch_set(atomic, 2), false);
    EXPECT_EQ(atomic.load(), 0b111);
  }

  {
    auto&& atomic = std::atomic<Integer>{0b1};
    EXPECT_EQ(fetch_set(atomic, 0), true);
    EXPECT_EQ(fetch_set(atomic, 0), true);
    EXPECT_EQ(fetch_set(atomic, 1), false);
    EXPECT_EQ(atomic.load(), 0b11);
    EXPECT_EQ(fetch_set(atomic, 2), false);
    EXPECT_EQ(atomic.load(), 0b111);
  }

  {
    for (auto i = 0; i < 100000; ++i) {
      // call makeUnpredictable() to ensure that the bit integer does not get
      // optimized away.  This is testing the feasability of this code in
      // situations where bit is not known at compile time and will likely force
      // a register load
      auto&& atomic = std::atomic<Integer>{0};
      auto&& bit = 0;
      folly::makeUnpredictable(bit);

      EXPECT_EQ(fetch_set(atomic, bit), false);
      EXPECT_EQ(fetch_set(atomic, bit + 1), false);
      EXPECT_EQ(atomic.load(), 0b11);
      EXPECT_EQ(fetch_set(atomic, bit + 2), false);
      EXPECT_EQ(atomic.load(), 0b111);
    }
  }
}

template <typename Integer, typename FetchReset = decltype(default_fetch_reset)>
void atomic_fetch_reset_basic(FetchReset fetch_reset = default_fetch_reset) {
  {
    auto&& atomic = std::atomic<Integer>{0};
    EXPECT_EQ(fetch_reset(atomic, 0), false);
    EXPECT_EQ(fetch_reset(atomic, 1), false);
    atomic.store(0b11);
    EXPECT_EQ(fetch_reset(atomic, 0), true);
    EXPECT_EQ(fetch_reset(atomic, 1), true);
    EXPECT_EQ(atomic.load(), 0);
  }

  {
    auto&& atomic = std::atomic<Integer>{0};
    EXPECT_EQ(fetch_reset(atomic, 0), false);
    EXPECT_EQ(fetch_reset(atomic, 1), false);
    atomic.store(0b11);
    EXPECT_EQ(fetch_reset(atomic, 1), true);
    EXPECT_EQ(fetch_reset(atomic, 0), true);
    EXPECT_EQ(atomic.load(), 0);
  }
}

template <typename Integer>
class Atomic {
 public:
  Atomic(std::function<void()> onFetchOr, std::function<void()> onFetchAnd)
      : onFetchOr_{std::move(onFetchOr)}, onFetchAnd_{std::move(onFetchAnd)} {}

  Integer fetch_or(
      Integer value,
      std::memory_order = std::memory_order_seq_cst) {
    onFetchOr_();
    return exchange(integer_, integer_ | value);
  }
  Integer fetch_and(
      Integer value,
      std::memory_order = std::memory_order_seq_cst) {
    onFetchAnd_();
    return exchange(integer_, integer_ & value);
  }

  Integer load(std::memory_order = std::memory_order_seq_cst) {
    return integer_;
  }

  std::function<void()> onFetchOr_;
  std::function<void()> onFetchAnd_;
  Integer integer_{0};
};

template <typename Integer, typename FetchSet = decltype(default_fetch_set)>
void atomic_fetch_set_non_std_atomic(FetchSet fetch_set = default_fetch_set) {
  auto sets = 0;
  auto resets = 0;
  auto atomic = Atomic<Integer>{[&] { ++sets; }, [&] { ++resets; }};

  fetch_set(atomic, 0);
  EXPECT_EQ(sets, 1);
  EXPECT_EQ(resets, 0);
  EXPECT_EQ(atomic.integer_, 0b1);

  fetch_set(atomic, 2);
  EXPECT_EQ(sets, 2);
  EXPECT_EQ(resets, 0);
  EXPECT_EQ(atomic.integer_, 0b101);
}

template <typename Integer, typename F = decltype(default_fetch_reset)>
void atomic_fetch_reset_non_std_atomic(F fetch_reset = default_fetch_reset) {
  auto sets = 0;
  auto resets = 0;
  auto atomic = Atomic<Integer>{[&] { ++sets; }, [&] { ++resets; }};
  atomic.integer_ = 0b111;

  fetch_reset(atomic, 0);
  EXPECT_EQ(sets, 0);
  EXPECT_EQ(resets, 1);
  EXPECT_EQ(atomic.integer_, 0b110);

  fetch_reset(atomic, 2);
  EXPECT_EQ(sets, 0);
  EXPECT_EQ(resets, 2);
  EXPECT_EQ(atomic.integer_, 0b010);
}
} // namespace

class AtomicFetchSetTest : public ::testing::Test {};
class AtomicFetchResetTest : public ::testing::Test {};

TEST_F(AtomicFetchSetTest, Basic) {
  atomic_fetch_set_basic<std::uint16_t>();
  atomic_fetch_set_basic<std::uint32_t>();
  atomic_fetch_set_basic<std::uint64_t>();
  atomic_fetch_set_basic<std::uint8_t>();
}

TEST_F(AtomicFetchResetTest, Basic) {
  atomic_fetch_reset_basic<std::uint16_t>();
  atomic_fetch_reset_basic<std::uint32_t>();
  atomic_fetch_reset_basic<std::uint64_t>();
  atomic_fetch_reset_basic<std::uint8_t>();
}

TEST_F(AtomicFetchSetTest, EnsureFetchOrUsed) {
  atomic_fetch_set_non_std_atomic<std::uint8_t>();
  atomic_fetch_set_non_std_atomic<std::uint16_t>();
  atomic_fetch_set_non_std_atomic<std::uint32_t>();
  atomic_fetch_set_non_std_atomic<std::uint64_t>();
}

TEST_F(AtomicFetchResetTest, EnsureFetchAndUsed) {
  atomic_fetch_reset_non_std_atomic<std::uint8_t>();
  atomic_fetch_reset_non_std_atomic<std::uint16_t>();
  atomic_fetch_reset_non_std_atomic<std::uint32_t>();
  atomic_fetch_reset_non_std_atomic<std::uint64_t>();
}

TEST_F(AtomicFetchSetTest, FetchSetDefault) {
  auto fetch_set = [](auto&&... args) {
    return detail::atomic_fetch_set_default(args..., std::memory_order_seq_cst);
  };

  atomic_fetch_set_basic<std::uint16_t>(fetch_set);
  atomic_fetch_set_basic<std::uint32_t>(fetch_set);
  atomic_fetch_set_basic<std::uint64_t>(fetch_set);
  atomic_fetch_set_basic<std::uint8_t>(fetch_set);

  atomic_fetch_set_non_std_atomic<std::uint8_t>(fetch_set);
  atomic_fetch_set_non_std_atomic<std::uint16_t>(fetch_set);
  atomic_fetch_set_non_std_atomic<std::uint32_t>(fetch_set);
  atomic_fetch_set_non_std_atomic<std::uint64_t>(fetch_set);
}

TEST_F(AtomicFetchSetTest, FetchResetDefault) {
  auto fetch_reset = [](auto&&... args) {
    return detail::atomic_fetch_reset_default(
        args..., std::memory_order_seq_cst);
  };

  atomic_fetch_reset_basic<std::uint16_t>(fetch_reset);
  atomic_fetch_reset_basic<std::uint32_t>(fetch_reset);
  atomic_fetch_reset_basic<std::uint64_t>(fetch_reset);
  atomic_fetch_reset_basic<std::uint8_t>(fetch_reset);

  atomic_fetch_reset_non_std_atomic<std::uint8_t>(fetch_reset);
  atomic_fetch_reset_non_std_atomic<std::uint16_t>(fetch_reset);
  atomic_fetch_reset_non_std_atomic<std::uint32_t>(fetch_reset);
  atomic_fetch_reset_non_std_atomic<std::uint64_t>(fetch_reset);
}

TEST_F(AtomicFetchSetTest, FetchSetX86) {
  if (folly::kIsArchAmd64) {
    auto fetch_set = [](auto&&... args) {
      return detail::atomic_fetch_set_x86(args..., std::memory_order_seq_cst);
    };

    atomic_fetch_set_basic<std::uint16_t>(fetch_set);
    atomic_fetch_set_basic<std::uint32_t>(fetch_set);
    atomic_fetch_set_basic<std::uint64_t>(fetch_set);
    atomic_fetch_set_basic<std::uint8_t>(fetch_set);

    atomic_fetch_set_non_std_atomic<std::uint8_t>(fetch_set);
    atomic_fetch_set_non_std_atomic<std::uint16_t>(fetch_set);
    atomic_fetch_set_non_std_atomic<std::uint32_t>(fetch_set);
    atomic_fetch_set_non_std_atomic<std::uint64_t>(fetch_set);
  }
}

TEST_F(AtomicFetchResetTest, FetchResetX86) {
  if (folly::kIsArchAmd64) {
    auto fetch_reset = [](auto&&... args) {
      return detail::atomic_fetch_reset_x86(args..., std::memory_order_seq_cst);
    };

    atomic_fetch_reset_basic<std::uint16_t>(fetch_reset);
    atomic_fetch_reset_basic<std::uint32_t>(fetch_reset);
    atomic_fetch_reset_basic<std::uint64_t>(fetch_reset);
    atomic_fetch_reset_basic<std::uint8_t>(fetch_reset);

    atomic_fetch_reset_non_std_atomic<std::uint8_t>(fetch_reset);
    atomic_fetch_reset_non_std_atomic<std::uint16_t>(fetch_reset);
    atomic_fetch_reset_non_std_atomic<std::uint32_t>(fetch_reset);
    atomic_fetch_reset_non_std_atomic<std::uint64_t>(fetch_reset);
  }
}

} // namespace folly
