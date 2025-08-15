/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawTextProps.h"

#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

namespace facebook::react {

RawTextProps::RawTextProps(
    const PropsParserContext& context,
    const RawTextProps& sourceProps,
    const RawProps& rawProps)
    : Props(context, sourceProps, rawProps),
      text(convertRawProp(context, rawProps, "text", sourceProps.text, {})){};

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("text", text)};
}
#endif

#ifdef RN_SERIALIZABLE_STATE

ComponentName RawTextProps::getDiffPropsImplementationTarget() const {
  return "RawText";
}

folly::dynamic RawTextProps::getDiffProps(const Props* prevProps) const {
  folly::dynamic result = folly::dynamic::object();

  static const auto defaultProps = RawTextProps();

  const RawTextProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const RawTextProps*>(prevProps);

  if (this == oldProps) {
    return result;
  }

  if (text != oldProps->text) {
    result["text"] = text;
  }

  return result;
}

#endif

} // namespace facebook::react
