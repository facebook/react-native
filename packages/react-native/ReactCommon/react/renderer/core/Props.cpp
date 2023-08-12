/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Props.h"
#include "PropsMapBuffer.h"

#include <folly/dynamic.h>
#include <react/renderer/core/CoreFeatures.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

Props::Props(
    const PropsParserContext &context,
    const Props &sourceProps,
    const RawProps &rawProps,
    const bool shouldSetRawProps)
    : nativeId(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.nativeId
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "nativeID",
                                                       sourceProps.nativeId,
                                                       {}))
#ifdef ANDROID
      ,
      rawProps(
          shouldSetRawProps ? (folly::dynamic)rawProps
                            : /* null */ folly::dynamic())
#endif
{
}

void Props::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char * /*propName*/,
    RawValue const &value) {
  switch (hash) {
    case CONSTEXPR_RAW_PROPS_KEY_HASH("nativeID"):
      fromRawValue(context, value, nativeId, {});
      return;
  }
}

} // namespace facebook::react
