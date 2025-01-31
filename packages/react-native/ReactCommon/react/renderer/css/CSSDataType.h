/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <any>
#include <concepts>
#include <optional>
#include <variant>

#include <react/renderer/css/CSSSyntaxParser.h>

namespace facebook::react {

/**
 * May be specialized to instruct the CSS value parser how to parse a given data
 * type, according to CSSValidDataTypeParser.
 */
template <typename CSSDataTypeT>
struct CSSDataTypeParser {};

/**
 * Accepts a CSS function block and may parse it (and future syntax) into a
 * concrete representation.
 */
template <typename T, typename ReturnT = std::any>
concept CSSFunctionBlockSink =
    requires(const CSSFunctionBlock& func, CSSSyntaxParser& parser) {
      { T::consumeFunctionBlock(func, parser) } -> std::convertible_to<ReturnT>;
    };

/**
 * Accepts a CSS simple block and may parse it (and future syntax) into a
 * concrete representation.
 */
template <typename T, typename ReturnT = std::any>
concept CSSSimpleBlockSink =
    requires(const CSSSimpleBlock& block, CSSSyntaxParser& parser) {
      { T::consumeSimpleBlock(block, parser) } -> std::convertible_to<ReturnT>;
    };

/**
 * Accepts a CSS preserved token and may parse it (and future syntax) into a
 * concrete representation.
 */
template <typename T, typename ReturnT = std::any>
concept CSSPreservedTokenSink = requires(const CSSPreservedToken& token) {
  { T::consumePreservedToken(token) } -> std::convertible_to<ReturnT>;
};

/**
 * Accepts a raw syntax parser, to be able to parse compounded values
 */
template <typename T, typename ReturnT = std::any>
concept CSSParserSink = requires(CSSSyntaxParser& parser) {
  { T::consume(parser) } -> std::convertible_to<ReturnT>;
};

/**
 * Represents a valid specialization of CSSDataTypeParser
 */
template <typename T, typename ReturnT = std::any>
concept CSSValidDataTypeParser =
    ((CSSFunctionBlockSink<T, ReturnT> || CSSSimpleBlockSink<T, ReturnT> ||
      CSSPreservedTokenSink<T, ReturnT>) &&
     !CSSParserSink<T, ReturnT>) ||
    CSSParserSink<T, ReturnT>;

/**
 * Concrete representation for a CSS data type
 */
template <typename T>
concept CSSDataType =
    CSSValidDataTypeParser<CSSDataTypeParser<T>, std::optional<T>> &&
    std::equality_comparable<T>;

} // namespace facebook::react
