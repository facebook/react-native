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

#pragma once

#include <glog/logging.h>

#ifdef _MSC_VER
#include <immintrin.h>
#endif

#include <folly/CpuId.h>
#include <folly/Portability.h>
#include <folly/lang/Assume.h>
#include <folly/portability/Builtins.h>

namespace folly {
namespace compression {
namespace instructions {

// NOTE: It's recommended to compile EF coding with -msse4.2, starting
// with Nehalem, Intel CPUs support POPCNT instruction and gcc will emit
// it for __builtin_popcountll intrinsic.
// But we provide an alternative way for the client code: it can switch to
// the appropriate version of EliasFanoReader<> at runtime (client should
// implement this switching logic itself) by specifying instruction set to
// use explicitly.

struct Default {
  static bool supported(const folly::CpuId& /* cpuId */ = {}) {
    return true;
  }
  static FOLLY_ALWAYS_INLINE uint64_t popcount(uint64_t value) {
    return uint64_t(__builtin_popcountll(value));
  }
  static FOLLY_ALWAYS_INLINE int ctz(uint64_t value) {
    DCHECK_GT(value, 0u);
    return __builtin_ctzll(value);
  }
  static FOLLY_ALWAYS_INLINE int clz(uint64_t value) {
    DCHECK_GT(value, 0u);
    return __builtin_clzll(value);
  }
  static FOLLY_ALWAYS_INLINE uint64_t blsr(uint64_t value) {
    return value & (value - 1);
  }

  // Extract `length` bits starting from `start` from value. Only bits [0:63]
  // will be extracted. All higher order bits in the
  // result will be zeroed. If no bits are extracted, return 0.
  static FOLLY_ALWAYS_INLINE uint64_t
  bextr(uint64_t value, uint32_t start, uint32_t length) {
    if (start > 63) {
      return 0ULL;
    }
    if (start + length > 64) {
      length = 64 - start;
    }

    return (value >> start) &
        ((length == 64) ? (~0ULL) : ((1ULL << length) - 1ULL));
  }

  // Clear high bits starting at position index.
  static FOLLY_ALWAYS_INLINE uint64_t bzhi(uint64_t value, uint32_t index) {
    if (index > 63) {
      return 0;
    }
    return value & ((uint64_t(1) << index) - 1);
  }
};

struct Nehalem : public Default {
  static bool supported(const folly::CpuId& cpuId = {}) {
    return cpuId.popcnt();
  }

  static FOLLY_ALWAYS_INLINE uint64_t popcount(uint64_t value) {
// POPCNT is supported starting with Intel Nehalem, AMD K10.
#if defined(__GNUC__) || defined(__clang__)
    // GCC and Clang won't inline the intrinsics.
    uint64_t result;
    asm("popcntq %1, %0" : "=r"(result) : "r"(value));
    return result;
#else
    return uint64_t(_mm_popcnt_u64(value));
#endif
  }
};

struct Haswell : public Nehalem {
  static bool supported(const folly::CpuId& cpuId = {}) {
    return Nehalem::supported(cpuId) && cpuId.bmi1() && cpuId.bmi2();
  }

  static FOLLY_ALWAYS_INLINE uint64_t blsr(uint64_t value) {
// BMI1 is supported starting with Intel Haswell, AMD Piledriver.
// BLSR combines two instructions into one and reduces register pressure.
#if defined(__GNUC__) || defined(__clang__)
    // GCC and Clang won't inline the intrinsics.
    uint64_t result;
    asm("blsrq %1, %0" : "=r"(result) : "r"(value));
    return result;
#else
    return _blsr_u64(value);
#endif
  }

  static FOLLY_ALWAYS_INLINE uint64_t
  bextr(uint64_t value, uint32_t start, uint32_t length) {
#if defined(__GNUC__) || defined(__clang__)
    // GCC and Clang won't inline the intrinsics.
    // Encode parameters in `pattern` where `pattern[0:7]` is `start` and
    // `pattern[8:15]` is `length`.
    // Ref: Intel Advanced Vector Extensions Programming Reference
    uint64_t pattern = start & 0xFF;
    pattern = pattern | ((length & 0xFF) << 8);
    uint64_t result;
    asm("bextrq %2, %1, %0" : "=r"(result) : "r"(value), "r"(pattern));
    return result;
#else
    return _bextr_u64(value, start, length);
#endif
  }

  static FOLLY_ALWAYS_INLINE uint64_t bzhi(uint64_t value, uint32_t index) {
#if defined(__GNUC__) || defined(__clang__)
    // GCC and Clang won't inline the intrinsics.
    const uint64_t index64 = index;
    uint64_t result;
    asm("bzhiq %2, %1, %0" : "=r"(result) : "r"(value), "r"(index64));
    return result;
#else
    return _bzhi_u64(value, index);
#endif
  }
};

enum class Type {
  DEFAULT,
  NEHALEM,
  HASWELL,
};

inline Type detect() {
  const static Type type = [] {
    if (instructions::Haswell::supported()) {
      VLOG(2) << "Will use folly::compression::instructions::Haswell";
      return Type::HASWELL;
    } else if (instructions::Nehalem::supported()) {
      VLOG(2) << "Will use folly::compression::instructions::Nehalem";
      return Type::NEHALEM;
    } else {
      VLOG(2) << "Will use folly::compression::instructions::Default";
      return Type::DEFAULT;
    }
  }();
  return type;
}

template <class F>
auto dispatch(Type type, F&& f) -> decltype(f(std::declval<Default>())) {
  switch (type) {
    case Type::HASWELL:
      return f(Haswell());
    case Type::NEHALEM:
      return f(Nehalem());
    case Type::DEFAULT:
      return f(Default());
  }

  assume_unreachable();
}

template <class F>
auto dispatch(F&& f) -> decltype(f(std::declval<Default>())) {
  return dispatch(detect(), std::forward<F>(f));
}

} // namespace instructions
} // namespace compression
} // namespace folly
