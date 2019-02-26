/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedString.h>
#include <react/core/LocalData.h>
#include <react/textlayoutmanager/TextLayoutManager.h>

namespace facebook {
namespace react {

class ParagraphLocalData;

using SharedParagraphLocalData = std::shared_ptr<const ParagraphLocalData>;

/*
 * LocalData for <Paragraph> component.
 * Represents what to render and how to render.
 */
class ParagraphLocalData : public LocalData {
 public:
  /*
   * All content of <Paragraph> component represented as an `AttributedString`.
   */
  AttributedString getAttributedString() const;
  void setAttributedString(AttributedString attributedString);

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager getTextLayoutManager() const;
  void setTextLayoutManager(SharedTextLayoutManager textLayoutManager);

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  std::string getDebugName() const override;
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif

 private:
  AttributedString attributedString_;
  SharedTextLayoutManager textLayoutManager_;
};

} // namespace react
} // namespace facebook
