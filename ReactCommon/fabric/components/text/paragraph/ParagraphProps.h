/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>

#include <react/attributedstring/ParagraphAttributes.h>
#include <react/components/text/BaseTextProps.h>
#include <react/components/view/ViewProps.h>
#include <react/core/Props.h>

namespace facebook {
namespace react {

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class ParagraphProps : public ViewProps, public BaseTextProps {
 public:
  ParagraphProps() = default;
  ParagraphProps(const ParagraphProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  const ParagraphAttributes paragraphAttributes{};

  /*
   * Defines can the text be selected (and copied) or not.
   */
  const bool isSelectable{};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace react
} // namespace facebook
