/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

/*
 * State for <TextInput> component.
 */
class AndroidTextInputState final {
 public:
  int64_t mostRecentEventCount{0};

  /**
   * Stores an opaque cache ID used on the Java side to refer to a specific
   * AttributedString for measurement purposes only.
   */
  int64_t cachedAttributedStringId{0};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * Only set if changed from the React tree's perspective.
   */
  AttributedString attributedString{};

  /*
   * All content of <TextInput> component represented as an `AttributedString`.
   * This stores the previous computed *from the React tree*. This usually
   * doesn't change as the TextInput contents are being updated. If it does
   * change, we need to wipe out current contents of the TextInput and replace
   * with the new value from the tree.
   */
  AttributedString reactTreeAttributedString{};

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes{};

  /**
   * Communicates Android theme padding back to the ShadowNode / Component
   * Descriptor for layout.
   */
  float defaultThemePaddingStart{NAN};
  float defaultThemePaddingEnd{NAN};
  float defaultThemePaddingTop{NAN};
  float defaultThemePaddingBottom{NAN};

  AndroidTextInputState(
      int64_t mostRecentEventCount,
      AttributedString attributedString,
      AttributedString reactTreeAttributedString,
      ParagraphAttributes paragraphAttributes,
      float defaultThemePaddingStart,
      float defaultThemePaddingEnd,
      float defaultThemePaddingTop,
      float defaultThemePaddingBottom);

  AndroidTextInputState() = default;
  AndroidTextInputState(
      const AndroidTextInputState& previousState,
      const folly::dynamic& data);
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const;
};

} // namespace facebook::react
