/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/attributedstring/AttributedStringBox.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

/*
 * State for <TextInput> component.
 */
class TextInputState final {
 public:
  /*
   * All content of <TextInput> component.
   */
  AttributedStringBox attributedStringBox;

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

  /*
   * Revision of the State object.
   */
  size_t revision{0};
};

} // namespace react
} // namespace facebook
