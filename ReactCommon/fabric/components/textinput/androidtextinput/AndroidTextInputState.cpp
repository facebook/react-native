/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputState.h"

#include <react/components/text/conversions.h>
#include <react/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

#ifdef ANDROID
folly::dynamic AndroidTextInputState::getDynamic() const {
  // Java doesn't need all fields, so we don't pass them along.
  folly::dynamic newState = folly::dynamic::object();
  newState["mostRecentEventCount"] = mostRecentEventCount;
  newState["attributedString"] = toDynamic(attributedString);
  newState["paragraphAttributes"] = toDynamic(paragraphAttributes);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}
#endif

} // namespace react
} // namespace facebook
