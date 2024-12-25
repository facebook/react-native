/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphState.h"

#include <react/renderer/components/text/conversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

#ifdef ANDROID
folly::dynamic ParagraphState::getDynamic() const {
  LOG(FATAL) << "ParagraphState may only be serialized to MapBuffer";
}

MapBuffer ParagraphState::getMapBuffer() const {
  return toMapBuffer(*this);
}
#endif

} // namespace facebook::react
