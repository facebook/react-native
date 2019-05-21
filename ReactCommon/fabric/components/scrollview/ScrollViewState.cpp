/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewState.h"

namespace facebook {
namespace react {

Size ScrollViewState::getContentSize() const {
  return Size{contentBoundingRect.getMaxX(), contentBoundingRect.getMaxY()};
}

} // namespace react
} // namespace facebook
