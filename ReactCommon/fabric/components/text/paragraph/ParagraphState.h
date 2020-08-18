/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

/*
 * State for <Paragraph> component.
 * Represents what to render and how to render.
 */
class ParagraphState final {
 public:
  /*
   * All content of <Paragraph> component represented as an `AttributedString`.
   */
  AttributedString attributedString;

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager layoutManager;

#ifdef ANDROID
  ParagraphState(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      SharedTextLayoutManager const &layoutManager)
      : attributedString(attributedString),
        paragraphAttributes(paragraphAttributes),
        layoutManager(layoutManager) {}
  ParagraphState() = default;
  ParagraphState(
      ParagraphState const &previousState,
      folly::dynamic const &data) {
    assert(false && "Not supported");
  };
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
