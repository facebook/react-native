/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGStyle.h>

#include <react/core/Props.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  YGStyle yogaStyle{};

#if RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace react
} // namespace facebook
