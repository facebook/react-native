/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

ImageProps::ImageProps(
    const PropsParserContext &context,
    const ImageProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(context, sourceProps, rawProps),
      sources(
          convertRawProp(context, rawProps, "source", sourceProps.sources, {})),
      defaultSources(convertRawProp(
          context,
          rawProps,
          "defaultSource",
          sourceProps.defaultSources,
          {})),
      resizeMode(convertRawProp(
          context,
          rawProps,
          "resizeMode",
          sourceProps.resizeMode,
          ImageResizeMode::Stretch)),
      blurRadius(convertRawProp(
          context,
          rawProps,
          "blurRadius",
          sourceProps.blurRadius,
          {})),
      capInsets(convertRawProp(
          context,
          rawProps,
          "capInsets",
          sourceProps.capInsets,
          {})),
      tintColor(convertRawProp(
          context,
          rawProps,
          "tintColor",
          sourceProps.tintColor,
          {})),
      internal_analyticTag(convertRawProp(
          context,
          rawProps,
          "internal_analyticTag",
          sourceProps.internal_analyticTag,
          {})) {}

} // namespace react
} // namespace facebook
