/*
 * Copyright 2014-present Facebook, Inc.
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

namespace folly {

namespace detail {

// Return the state size needed by RNG, expressed as a number of uint32_t
// integers. Specialized for all templates specified in the C++11 standard.
// For some (mersenne_twister_engine), this is exported as a state_size static
// data member; for others, the standard shows formulas.

template <class RNG, typename = void>
struct StateSize {
  // A sane default.
  using type = std::integral_constant<size_t, 512>;
};

template <class RNG>
struct StateSize<RNG, void_t<decltype(RNG::state_size)>> {
  using type = std::integral_constant<size_t, RNG::state_size>;
};

template <class UIntType, UIntType a, UIntType c, UIntType m>
struct StateSize<std::linear_congruential_engine<UIntType, a, c, m>> {
  // From the standard [rand.eng.lcong], this is ceil(log2(m) / 32) + 3,
  // which is the same as ceil(ceil(log2(m) / 32) + 3, and
  // ceil(log2(m)) <= std::numeric_limits<UIntType>::digits
  using type = std::integral_constant<
      size_t,
      (std::numeric_limits<UIntType>::digits + 31) / 32 + 3>;
};

template <class UIntType, size_t w, size_t s, size_t r>
struct StateSize<std::subtract_with_carry_engine<UIntType, w, s, r>> {
  // [rand.eng.sub]: r * ceil(w / 32)
  using type = std::integral_constant<size_t, r*((w + 31) / 32)>;
};

template <typename RNG>
using StateSizeT = _t<StateSize<RNG>>;

template <class RNG>
struct SeedData {
  SeedData() {
    Random::secureRandom(seedData.data(), seedData.size() * sizeof(uint32_t));
  }

  static constexpr size_t stateSize = StateSizeT<RNG>::value;
  std::array<uint32_t, stateSize> seedData;
};

} // namespace detail

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

} // namespace folly
