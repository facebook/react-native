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

#ifndef FOLLY_RANDOM_H_
#error This file may only be included from folly/Random.h
#endif

#include <array>

namespace folly {

namespace detail {

// Return the state size needed by RNG, expressed as a number of uint32_t
// integers. Specialized for all templates specified in the C++11 standard.
// For some (mersenne_twister_engine), this is exported as a state_size static
// data member; for others, the standard shows formulas.

template <class RNG> struct StateSize {
  // A sane default.
  static constexpr size_t value = 512;
};

template <class RNG>
constexpr size_t StateSize<RNG>::value;

template <class UIntType, UIntType a, UIntType c, UIntType m>
struct StateSize<std::linear_congruential_engine<UIntType, a, c, m>> {
  // From the standard [rand.eng.lcong], this is ceil(log2(m) / 32) + 3,
  // which is the same as ceil(ceil(log2(m) / 32) + 3, and
  // ceil(log2(m)) <= std::numeric_limits<UIntType>::digits
  static constexpr size_t value =
    (std::numeric_limits<UIntType>::digits + 31) / 32 + 3;
};

template <class UIntType, UIntType a, UIntType c, UIntType m>
constexpr size_t
StateSize<std::linear_congruential_engine<UIntType, a, c, m>>::value;

template <class UIntType, size_t w, size_t n, size_t m, size_t r,
          UIntType a, size_t u, UIntType d, size_t s,
          UIntType b, size_t t,
          UIntType c, size_t l, UIntType f>
struct StateSize<std::mersenne_twister_engine<UIntType, w, n, m, r,
                                              a, u, d, s, b, t, c, l, f>> {
  static constexpr size_t value =
    std::mersenne_twister_engine<UIntType, w, n, m, r,
                                 a, u, d, s, b, t, c, l, f>::state_size;
};

template <class UIntType, size_t w, size_t n, size_t m, size_t r,
          UIntType a, size_t u, UIntType d, size_t s,
          UIntType b, size_t t,
          UIntType c, size_t l, UIntType f>
constexpr size_t
StateSize<std::mersenne_twister_engine<UIntType, w, n, m, r,
                                       a, u, d, s, b, t, c, l, f>>::value;

#if FOLLY_HAVE_EXTRANDOM_SFMT19937

template <class UIntType, size_t m, size_t pos1, size_t sl1, size_t sl2,
          size_t sr1, size_t sr2, uint32_t msk1, uint32_t msk2, uint32_t msk3,
          uint32_t msk4, uint32_t parity1, uint32_t parity2, uint32_t parity3,
          uint32_t parity4>
struct StateSize<__gnu_cxx::simd_fast_mersenne_twister_engine<
    UIntType, m, pos1, sl1, sl2, sr1, sr2, msk1, msk2, msk3, msk4,
    parity1, parity2, parity3, parity4>> {
  static constexpr size_t value =
    __gnu_cxx::simd_fast_mersenne_twister_engine<
        UIntType, m, pos1, sl1, sl2, sr1, sr2,
        msk1, msk2, msk3, msk4,
        parity1, parity2, parity3, parity4>::state_size;
};

template <class UIntType, size_t m, size_t pos1, size_t sl1, size_t sl2,
          size_t sr1, size_t sr2, uint32_t msk1, uint32_t msk2, uint32_t msk3,
          uint32_t msk4, uint32_t parity1, uint32_t parity2, uint32_t parity3,
          uint32_t parity4>
constexpr size_t
StateSize<__gnu_cxx::simd_fast_mersenne_twister_engine<
    UIntType, m, pos1, sl1, sl2, sr1, sr2, msk1, msk2, msk3, msk4,
    parity1, parity2, parity3, parity4>>::value;

#endif

template <class UIntType, size_t w, size_t s, size_t r>
struct StateSize<std::subtract_with_carry_engine<UIntType, w, s, r>> {
  // [rand.eng.sub]: r * ceil(w / 32)
  static constexpr size_t value = r * ((w + 31) / 32);
};

template <class UIntType, size_t w, size_t s, size_t r>
constexpr size_t
StateSize<std::subtract_with_carry_engine<UIntType, w, s, r>>::value;

template <class RNG>
struct SeedData {
  SeedData() {
    Random::secureRandom(seedData.data(), seedData.size() * sizeof(uint32_t));
  }

  static constexpr size_t stateSize = StateSize<RNG>::value;
  std::array<uint32_t, stateSize> seedData;
};

}  // namespace detail

template <class RNG, class /* EnableIf */>
void Random::seed(RNG& rng) {
  detail::SeedData<RNG> sd;
  std::seed_seq s(std::begin(sd.seedData), std::end(sd.seedData));
  rng.seed(s);
}

template <class RNG, class /* EnableIf */>
auto Random::create() -> RNG {
  detail::SeedData<RNG> sd;
  std::seed_seq s(std::begin(sd.seedData), std::end(sd.seedData));
  return RNG(s);
}

}  // namespaces
