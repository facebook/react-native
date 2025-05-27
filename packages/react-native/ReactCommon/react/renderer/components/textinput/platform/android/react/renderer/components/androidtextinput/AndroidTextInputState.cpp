/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputState.h"

#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/text/ParagraphState.h>

namespace facebook::react {

folly::dynamic AndroidTextInputState::getDynamic() const {
  LOG(FATAL) << "TextInputState state should only be read using MapBuffer";
}

MapBuffer AndroidTextInputState::getMapBuffer() const {
  auto builder = MapBufferBuilder();
  // If we have a `cachedAttributedStringId` we know that we're (1) not trying
  // to set a new string, so we don't need to pass it along; (2) setState was
  // called from Java to trigger a relayout with a `cachedAttributedStringId`,
  // so Java has all up-to-date information and we should pass an empty map
  // through.
  if (cachedAttributedStringId == 0) {
    // TODO truncation
    builder.putInt(
        TX_STATE_KEY_MOST_RECENT_EVENT_COUNT,
        static_cast<int32_t>(mostRecentEventCount));

    auto attStringMapBuffer = toMapBuffer(attributedStringBox.getValue());
    builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
    auto paMapBuffer = toMapBuffer(paragraphAttributes);
    builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);

    builder.putInt(TX_STATE_KEY_HASH, attStringMapBuffer.getInt(AS_KEY_HASH));
  }
  return builder.build();
}

} // namespace facebook::react
