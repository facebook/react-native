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
#include <fabric/core/Props.h>
#include <fabric/view/ViewProps.h>

namespace facebook {
namespace react {

class ParagraphProps;

using SharedParagraphProps = std::shared_ptr<const ParagraphProps>;

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class ParagraphProps:
  public ViewProps {

public:

  void apply(const RawProps &rawProps) override;

#pragma mark - Getters

  /*
   * Returns `ParagraphAttributes` object which has all prop values that affect
   * visual representation of the paragraph.
   */
  ParagraphAttributes getParagraphAttributes() const;

  /*
   * Defines can the text be selected (and copied) or not.
   */
  bool getIsSelectable() const;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

private:

  ParagraphAttributes paragraphAttributes_ {};
  bool isSelectable_ {false};
};

} // namespace react
} // namespace facebook
