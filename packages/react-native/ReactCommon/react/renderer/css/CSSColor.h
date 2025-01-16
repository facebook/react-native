/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSHexColor.h>
#include <react/renderer/css/CSSNamedColor.h>

namespace facebook::react {

/**
 * Representation of CSS <color> data type
 * https://www.w3.org/TR/css-color-5/#typedef-color
 */
struct CSSColor {
  uint8_t r{};
  uint8_t g{};
  uint8_t b{};
  uint8_t a{};
};

template <>
struct CSSDataTypeParser<CSSColor> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken& token)
      -> std::optional<CSSColor> {
    switch (token.type()) {
      case CSSTokenType::Ident:
        return parseCSSNamedColor<CSSColor>(token.stringValue());
      case CSSTokenType::Hash:
        return parseCSSHexColor<CSSColor>(token.stringValue());
      default:
        return {};
    }
  }
};

static_assert(CSSDataType<CSSColor>);

} // namespace facebook::react
