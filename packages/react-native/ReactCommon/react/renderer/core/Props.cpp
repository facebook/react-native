/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"

#include <folly/dynamic.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

Props::Props(
    const PropsParserContext &context,
    const Props &sourceProps,
    const RawProps &rawProps,
    const bool shouldSetRawProps)
    : nativeId(convertRawProp(
          context,
          rawProps,
          "nativeID",
          sourceProps.nativeId,
          {})),
      revision(sourceProps.revision + 1)
#ifdef ANDROID
      ,
      rawProps(
          shouldSetRawProps ? (folly::dynamic)rawProps
                            : /* null */ folly::dynamic())
#endif
          {};

} // namespace react
} // namespace facebook
