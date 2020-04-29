<<<<<<< HEAD
/**
=======
/*
>>>>>>> fb/0.62-stable
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedString.h>
<<<<<<< HEAD
=======
#include <react/attributedstring/ParagraphAttributes.h>
>>>>>>> fb/0.62-stable
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
<<<<<<< HEAD
=======
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  /*
>>>>>>> fb/0.62-stable
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager layoutManager;

#ifdef ANDROID
  ParagraphState(
      AttributedString const &attributedString,
<<<<<<< HEAD
      SharedTextLayoutManager const &layoutManager)
      : attributedString(attributedString), layoutManager(layoutManager) {}
  ParagraphState() = default;
  ParagraphState(folly::dynamic const &data) {
=======
      ParagraphAttributes const &paragraphAttributes,
      SharedTextLayoutManager const &layoutManager)
      : attributedString(attributedString),
        paragraphAttributes(paragraphAttributes),
        layoutManager(layoutManager) {}
  ParagraphState() = default;
  ParagraphState(
      ParagraphState const &previousState,
      folly::dynamic const &data) {
>>>>>>> fb/0.62-stable
    assert(false && "Not supported");
  };
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
