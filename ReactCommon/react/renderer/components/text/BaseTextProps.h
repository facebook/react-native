/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * `Props`-like class which is used as a base class for all Props classes
 * that can have text attributes (such as Text and Paragraph).
 */
class BaseTextProps {
 public:
  BaseTextProps() = default;
  BaseTextProps(
      const PropsParserContext &context,
      const BaseTextProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  TextAttributes textAttributes{};

#pragma mark - DebugStringConvertible (partially)

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace react
} // namespace facebook
