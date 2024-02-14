/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/utils/CoreFeatures.h>

namespace facebook::react {

ImageProps::ImageProps(
    const PropsParserContext& context,
    const ImageProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      sources(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.sources
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "source",
                                                       sourceProps.sources,
                                                       {})),
      defaultSources(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.defaultSources
              : convertRawProp(
                    context,
                    rawProps,
                    "defaultSource",
                    sourceProps.defaultSources,
                    {})),
      resizeMode(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.resizeMode
              : convertRawProp(
                    context,
                    rawProps,
                    "resizeMode",
                    sourceProps.resizeMode,
                    ImageResizeMode::Stretch)),
      blurRadius(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.blurRadius
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "blurRadius",
                                                       sourceProps.blurRadius,
                                                       {})),
      capInsets(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.capInsets
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "capInsets",
                                                       sourceProps.capInsets,
                                                       {})),
      tintColor(
          CoreFeatures::enablePropIteratorSetter ? sourceProps.tintColor
                                                 : convertRawProp(
                                                       context,
                                                       rawProps,
                                                       "tintColor",
                                                       sourceProps.tintColor,
                                                       {})),
      internal_analyticTag(
          CoreFeatures::enablePropIteratorSetter
              ? sourceProps.internal_analyticTag
              : convertRawProp(
                    context,
                    rawProps,
                    "internal_analyticTag",
                    sourceProps.internal_analyticTag,
                    {})) {}

void ImageProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);

  static auto defaults = ImageProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE(sources, "source");
    RAW_SET_PROP_SWITCH_CASE(defaultSources, "defaultSource");
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(blurRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(capInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(tintColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(internal_analyticTag);
  }
}

} // namespace facebook::react
