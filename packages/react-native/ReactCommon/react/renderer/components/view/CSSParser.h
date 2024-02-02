/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/components/view/CSSValue.h>

namespace facebook::react {

/*
 * Parses a single CSS component value, specialized to a given type.
 * See https://www.w3.org/TR/css-syntax-3/#parse-component-value
 */
template <typename CSSValueT>
CSSValueT parseCSSValue(std::string_view css) = delete;

template <>
CSSKeywordValue parseCSSValue<CSSKeywordValue>(std::string_view css);

template <>
CSSLengthValue parseCSSValue<CSSLengthValue>(std::string_view css);

template <>
CSSLengthPercentageValue parseCSSValue<CSSLengthPercentageValue>(
    std::string_view css);

template <>
CSSNumberValue parseCSSValue<CSSNumberValue>(std::string_view css);

} // namespace facebook::react
