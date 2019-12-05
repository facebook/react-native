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
class AndroidTextInputState final {
 public:
  int64_t mostRecentEventCount{0};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   */
  AttributedString attributedString{};

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes{};

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   */
  SharedTextLayoutManager layoutManager{};

#ifdef ANDROID
  AttributedString updateAttributedString(
      AttributedString const &original,
      folly::dynamic const &data) {
    if (data["textChanged"].empty()) {
      return original;
    }

    // TODO: parse other attributes besides just string?
    // on the other hand, not much should be driven from Java
    // TODO: it'd be really nice to treat these as operational transforms
    // instead of having to pass the whole string across.
    // Unfortunately we don't have a good way of communicating from Java to C++
    // *which* version of the State changes should be applied to; and if there's
    // a conflict, we don't have any recourse of any way to bail out of a
    // commit.

    auto str = AttributedString{};

    int i = 0;
    folly::dynamic fragments = data["textChanged"]["fragments"];
    for (auto const &fragment : original.getFragments()) {
      str.appendFragment(AttributedString::Fragment{
          fragments.size() > i ? fragments[i]["string"].getString() : "",
          fragment.textAttributes,
          fragment.parentShadowView});
      i++;
    }

    return str;
  }

  AndroidTextInputState(
      int64_t mostRecentEventCount,
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      SharedTextLayoutManager const &layoutManager)
      : mostRecentEventCount(mostRecentEventCount),
        attributedString(attributedString),
        paragraphAttributes(paragraphAttributes),
        layoutManager(layoutManager) {}
  AndroidTextInputState() = default;
  AndroidTextInputState(
      AndroidTextInputState const &previousState,
      folly::dynamic const &data)
      : mostRecentEventCount((int64_t)data["mostRecentEventCount"].getInt()),
        attributedString(
            updateAttributedString(previousState.attributedString, data)),
        paragraphAttributes(previousState.paragraphAttributes),
        layoutManager(previousState.layoutManager){};
  folly::dynamic getDynamic() const;
#endif
};

} // namespace react
} // namespace facebook
