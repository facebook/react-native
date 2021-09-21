/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputState.h"

#include <react/renderer/components/text/conversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace react {

#ifdef ANDROID
folly::dynamic AndroidTextInputState::getDynamic() const {
  // Java doesn't need all fields, so we don't pass them along.
  folly::dynamic newState = folly::dynamic::object();
  newState["mostRecentEventCount"] = mostRecentEventCount;
  newState["attributedString"] = toDynamic(attributedString);
  newState["hash"] = newState["attributedString"]["hash"];
  newState["paragraphAttributes"] =
      toDynamic(paragraphAttributes); // TODO: can we memoize this in Java?
  return newState;
}
#endif

} // namespace react
} // namespace facebook
