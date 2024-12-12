/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

namespace facebook::react {

Float TextLayoutManager::baseline(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const Size& size) const {
  auto lines =
      this->measureLines(attributedStringBox, paragraphAttributes, size);

  if (!lines.empty()) {
    return lines[0].ascender;
  } else {
    return 0;
  }
}

} // namespace facebook::react
