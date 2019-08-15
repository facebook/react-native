/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <cstddef>
#include <limits>
#include <type_traits>
#include <yoga/YGEnums.h>

namespace facebook {
namespace yoga {

namespace detail {

constexpr size_t log2ceil(size_t n) {
  return n < 1 ? 0 : (1 + log2ceil(n / 2));
}

// The number of bits necessary to represent enums defined with YG_ENUM_SEQ_DECL
template <typename Enum>
constexpr size_t bitWidth() {
  static_assert(
      enums::count<Enum>() > 0, "Enums must have at least one entries");
  return log2ceil(enums::count<Enum>() - 1);
}

// Number of bits needed for a boolean
template <>
constexpr size_t bitWidth<bool>() {
  return 1;
}

template <typename U, typename... Ts>
struct BitTraits {};

template <typename U>
struct BitTraits<U> {
  // Base cases
  static constexpr size_t width(size_t) { return 0; }
  static constexpr size_t shift(size_t) { return 0; }
};

template <typename U, typename T, typename... Ts>
struct BitTraits<U, T, Ts...> {
  using Rest = BitTraits<U, Ts...>;

  static constexpr size_t width(size_t idx) {
    return idx == 0 ? bitWidth<T>() : Rest::width(idx - 1);
  }

  static constexpr size_t shift(size_t idx) {
    return idx == 0 ? Rest::width(0) + Rest::shift(0) : Rest::shift(idx - 1);
  }

  static constexpr U mask(size_t idx) {
    return ((U{1} << width(idx)) - 1) << shift(idx);
  }
};

template <size_t Idx, typename T, typename... Ts>
struct IndexedType {
  using Type = typename IndexedType<Idx - 1, Ts...>::Type;
};

template <typename T, typename... Ts>
struct IndexedType<0, T, Ts...> {
  using Type = T;
};

} // namespace detail

template <typename Storage, typename... Fields>
class Bitfield {
  static_assert(
      std::is_integral<Storage>::value,
      "Bitfield needs an integral storage type");
  static_assert(
      std::is_unsigned<Storage>::value,
      "Bitfield needs an unsigned storage type");
  static_assert(sizeof...(Fields) > 0, "Bitfield needs at least one member");

  using BitTraits = detail::BitTraits<Storage, Fields...>;

#if !defined(_MSC_VER) || _MSC_VER > 1914
  static_assert(
      BitTraits::shift(0) + BitTraits::width(0) <=
          std::numeric_limits<Storage>::digits,
      "Specified storage type is too narrow to hold all types");
#endif

  template <size_t Idx>
  using TypeAt = typename detail::IndexedType<Idx, Fields...>::Type;

  template <size_t Idx, typename Value, typename... Values>
  static constexpr Storage initStorage(Value value, Values... values) {
    return ((value << BitTraits::shift(Idx)) & BitTraits::mask(Idx)) |
        initStorage<Idx + 1, Values...>(values...);
  }

  template <size_t Idx>
  static constexpr Storage initStorage() {
    return Storage{0};
  }

  Storage storage_ = 0;

public:
  template <size_t Idx>
  class Ref {
    Bitfield& bitfield_;

  public:
    Ref(Bitfield& bitfield) : bitfield_(bitfield) {}
    Ref& operator=(TypeAt<Idx> value) {
      bitfield_.storage_ = (bitfield_.storage_ & ~BitTraits::mask(Idx)) |
          ((value << BitTraits::shift(Idx)) & BitTraits::mask(Idx));
      return *this;
    }
    operator TypeAt<Idx>() const {
      return const_cast<const Bitfield&>(bitfield_).at<Idx>();
    }
  };

  constexpr Bitfield() = default;
  constexpr Bitfield(Fields... values) : storage_{initStorage<0>(values...)} {}

  template <size_t Idx>
  constexpr TypeAt<Idx> at() const {
    return static_cast<TypeAt<Idx>>(
        (storage_ & BitTraits::mask(Idx)) >> BitTraits::shift(Idx));
  }

  template <size_t Idx>
  Ref<Idx> at() {
    return {*this};
  }
};

} // namespace yoga
} // namespace facebook
