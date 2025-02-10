/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSDataType.h>

namespace facebook::react {

namespace detail {
struct CSSCompoundDataTypeMarker {};
} // namespace detail

/**
 * Allows grouping together multiple possible CSSDataType to parse.
 */
template <CSSDataType... AllowedTypesT>
struct CSSCompoundDataType : public detail::CSSCompoundDataTypeMarker {};

template <typename T>
concept CSSValidCompoundDataType =
    std::is_base_of_v<detail::CSSCompoundDataTypeMarker, T>;

/**
 * A concrete data type, or a compound data type which represents multiple other
 * data types.
 */
template <typename T>
concept CSSMaybeCompoundDataType =
    CSSDataType<T> || CSSValidCompoundDataType<T>;

namespace detail {

// inspired by https://stackoverflow.com/a/76255307
template <CSSMaybeCompoundDataType... AllowedTypesT>
struct merge_data_types;

template <
    CSSDataType... AlllowedTypes1T,
    CSSDataType... AlllowedTypes2T,
    CSSMaybeCompoundDataType... RestT>
struct merge_data_types<
    CSSCompoundDataType<AlllowedTypes1T...>,
    CSSCompoundDataType<AlllowedTypes2T...>,
    RestT...> {
  using type = typename merge_data_types<
      CSSCompoundDataType<AlllowedTypes1T..., AlllowedTypes2T...>,
      RestT...>::type;
};

template <
    CSSDataType AlllowedType1T,
    CSSDataType... AlllowedTypes2T,
    CSSMaybeCompoundDataType... RestT>
struct merge_data_types<
    AlllowedType1T,
    CSSCompoundDataType<AlllowedTypes2T...>,
    RestT...> {
  using type = typename merge_data_types<
      CSSCompoundDataType<AlllowedType1T, AlllowedTypes2T...>,
      RestT...>::type;
};

template <
    CSSDataType AlllowedType2T,
    CSSDataType... AlllowedTypes1T,
    CSSMaybeCompoundDataType... RestT>
struct merge_data_types<
    CSSCompoundDataType<AlllowedTypes1T...>,
    AlllowedType2T,
    RestT...> {
  using type = typename merge_data_types<
      CSSCompoundDataType<AlllowedTypes1T..., AlllowedType2T>,
      RestT...>::type;
};

template <
    CSSDataType AlllowedType1T,
    CSSDataType AlllowedType2T,
    CSSMaybeCompoundDataType... RestT>
struct merge_data_types<AlllowedType1T, AlllowedType2T, RestT...> {
  using type = typename merge_data_types<
      CSSCompoundDataType<AlllowedType1T, AlllowedType2T>,
      RestT...>::type;
};

template <CSSDataType... AllowedTypesT>
struct merge_data_types<CSSCompoundDataType<AllowedTypesT...>> {
  using type = CSSCompoundDataType<AllowedTypesT...>;
};

template <CSSDataType AllowedTypeT>
struct merge_data_types<AllowedTypeT> {
  using type = CSSCompoundDataType<AllowedTypeT>;
};

template <typename... T>
struct merge_variant;

template <CSSDataType... AllowedTypesT, typename... RestT>
struct merge_variant<CSSCompoundDataType<AllowedTypesT...>, RestT...> {
  using type = std::variant<RestT..., AllowedTypesT...>;
};
} // namespace detail

/**
 * Merges a set of compound or non-compound data types into a single compound
 * data type
 */
template <CSSMaybeCompoundDataType... T>
using CSSMergedDataTypes = typename detail::merge_data_types<T...>::type;

template <typename MergedTypeT, typename... RestT>
using CSSVariantWithTypes =
    typename detail::merge_variant<MergedTypeT, RestT...>::type;

} // namespace facebook::react
