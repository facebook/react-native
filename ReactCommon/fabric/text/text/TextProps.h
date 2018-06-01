/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/TextAttributes.h>
#include <fabric/core/Props.h>
#include <fabric/graphics/Color.h>
#include <fabric/graphics/Geometry.h>
#include <fabric/text/BaseTextProps.h>

namespace facebook {
namespace react {

class TextProps;

using SharedTextProps = std::shared_ptr<const TextProps>;

class TextProps:
  public Props,
  public BaseTextProps {

public:

  TextProps() = default;
  TextProps(const TextProps &sourceProps, const RawProps &rawProps);

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace react
} // namespace facebook
