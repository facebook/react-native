/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformScrollViewProps.h"

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

HostPlatformScrollViewProps::HostPlatformScrollViewProps(
    const PropsParserContext& context,
    const HostPlatformScrollViewProps& sourceProps,
    const RawProps& rawProps)
    : BaseScrollViewProps(context, sourceProps, rawProps),
      fadingEdgeLength(convertRawProp(
          context,
          rawProps,
          "fadingEdgeLength",
          sourceProps.fadingEdgeLength,
          nullptr)) {}

void HostPlatformScrollViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseScrollViewProps::setProp(context, hash, propName, value);

  static auto defaults = HostPlatformScrollViewProps{};

  switch (hash) { RAW_SET_PROP_SWITCH_CASE_BASIC(fadingEdgeLength); }
}

} // namespace facebook::react
