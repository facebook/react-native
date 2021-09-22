/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextMeasureCache.h"

namespace facebook {
namespace react {

bool LineMeasurement::operator==(LineMeasurement const &rhs) const {
  return std::tie(
             this->text,
             this->frame,
             this->descender,
             this->capHeight,
             this->ascender,
             this->xHeight) ==
      std::tie(
             rhs.text,
             rhs.frame,
             rhs.descender,
             rhs.capHeight,
             rhs.ascender,
             rhs.xHeight);
}

} // namespace react
} // namespace facebook
