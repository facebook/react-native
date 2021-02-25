/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <react/renderer/components/rncore/Props.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

#ifdef ANDROID
inline folly::dynamic toDynamic(AndroidProgressBarProps const &props) {
  folly::dynamic serializedProps = folly::dynamic::object();
  serializedProps["styleAttr"] = props.styleAttr;
  serializedProps["typeAttr"] = props.typeAttr;
  serializedProps["indeterminate"] = props.indeterminate;
  serializedProps["progress"] = props.progress;
  serializedProps["animating"] = props.animating;
  serializedProps["color"] = toDynamic(props.color);
  serializedProps["testID"] = props.testID;
  return serializedProps;
}
#endif

} // namespace react
} // namespace facebook
