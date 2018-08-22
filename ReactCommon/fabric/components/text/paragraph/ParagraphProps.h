/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>

#include <fabric/attributedstring/ParagraphAttributes.h>
#include <fabric/components/text/BaseTextProps.h>
#include <fabric/components/view/ViewProps.h>
#include <fabric/core/Props.h>

namespace facebook {
namespace react {

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class ParagraphProps:
  public ViewProps,
  public BaseTextProps {

public:
  ParagraphProps() = default;
  ParagraphProps(const ParagraphProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  /*
   * Contains all prop values that affect visual representation of the paragraph.
   */
  const ParagraphAttributes paragraphAttributes {};

  /*
   * Defines can the text be selected (and copied) or not.
   */
  const bool isSelectable {};

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

};

} // namespace react
} // namespace facebook
