// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <folly/dynamic.h>
#include <react/attributedstring/conversions.h>
#include <react/components/text/ParagraphState.h>

namespace facebook {
namespace react {

#ifdef ANDROID
inline folly::dynamic toDynamic(ParagraphState const &paragraphState) {
  folly::dynamic newState = folly::dynamic::object();
  newState["attributedString"] = toDynamic(paragraphState.attributedString);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}
#endif

} // namespace react
} // namespace facebook
