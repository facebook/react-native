// Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include <folly/dynamic.h>
#include <react/attributedstring/conversions.h>
#include <react/components/text/ParagraphLocalData.h>

namespace facebook {
namespace react {

#ifdef ANDROID

inline folly::dynamic toDynamic(const ParagraphLocalData &paragraphLocalData) {
  folly::dynamic newLocalData = folly::dynamic::object();
  newLocalData["attributedString"] =
      toDynamic(paragraphLocalData.getAttributedString());
  newLocalData["hash"] = newLocalData["attributedString"]["hash"];
  return newLocalData;
}

#endif

} // namespace react
} // namespace facebook
