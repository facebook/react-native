/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/components/text/ParagraphState.h>
#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace facebook {
namespace react {

#ifdef ANDROID
inline folly::dynamic toDynamic(ParagraphState const &paragraphState) {
  folly::dynamic newState = folly::dynamic::object();
  newState["attributedString"] = toDynamic(paragraphState.attributedString);
  newState["paragraphAttributes"] =
      toDynamic(paragraphState.paragraphAttributes);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}

// constants for Text State serialization
constexpr static Key TX_STATE_KEY_ATTRIBUTED_STRING = 0;
constexpr static Key TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
// Used for TextInput
constexpr static Key TX_STATE_KEY_HASH = 2;
constexpr static Key TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;

inline MapBuffer toMapBuffer(ParagraphState const &paragraphState) {
  auto builder = MapBufferBuilder();
  auto attStringMapBuffer = toMapBuffer(paragraphState.attributedString);
  builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
  auto paMapBuffer = toMapBuffer(paragraphState.paragraphAttributes);
  builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);
  // TODO: Used for TextInput
  builder.putInt(TX_STATE_KEY_HASH, 1234);
  return builder.build();
}
#endif

} // namespace react
} // namespace facebook
