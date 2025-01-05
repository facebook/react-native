/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/conversions.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

ImageProps::ImageProps(
    const PropsParserContext& context,
    const ImageProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      sources(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.sources
              : convertRawProp(
                    context,
                    rawProps,
                    "source",
                    sourceProps.sources,
                    {})),
      defaultSource(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.defaultSource
              : convertRawProp(
                    context,
                    rawProps,
                    "defaultSource",
                    sourceProps.defaultSource,
                    {})),
      loadingIndicatorSource(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.loadingIndicatorSource
              : convertRawProp(
                    context,
                    rawProps,
                    "loadingIndicatorSource",
                    sourceProps.loadingIndicatorSource,
                    {})),
      resizeMode(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.resizeMode
              : convertRawProp(
                    context,
                    rawProps,
                    "resizeMode",
                    sourceProps.resizeMode,
                    ImageResizeMode::Stretch)),
      blurRadius(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.blurRadius
              : convertRawProp(
                    context,
                    rawProps,
                    "blurRadius",
                    sourceProps.blurRadius,
                    {})),
      capInsets(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.capInsets
              : convertRawProp(
                    context,
                    rawProps,
                    "capInsets",
                    sourceProps.capInsets,
                    {})),
      tintColor(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.tintColor
              : convertRawProp(
                    context,
                    rawProps,
                    "tintColor",
                    sourceProps.tintColor,
                    {})),
      internal_analyticTag(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.internal_analyticTag
              : convertRawProp(
                    context,
                    rawProps,
                    "internal_analyticTag",
                    sourceProps.internal_analyticTag,
                    {})),
      resizeMethod(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.internal_analyticTag
              : convertRawProp(
                    context,
                    rawProps,
                    "resizeMethod",
                    sourceProps.internal_analyticTag,
                    {})),
      resizeMultiplier(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.resizeMultiplier
              : convertRawProp(
                    context,
                    rawProps,
                    "resizeMultiplier",
                    sourceProps.resizeMultiplier,
                    {})),
      shouldNotifyLoadEvents(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.shouldNotifyLoadEvents
              : convertRawProp(
                    context,
                    rawProps,
                    "shouldNotifyLoadEvents",
                    sourceProps.shouldNotifyLoadEvents,
                    {})),
      overlayColor(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.overlayColor
              : convertRawProp(
                    context,
                    rawProps,
                    "overlayColor",
                    sourceProps.overlayColor,
                    {})),
      fadeDuration(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.fadeDuration
              : convertRawProp(
                    context,
                    rawProps,
                    "fadeDuration",
                    sourceProps.fadeDuration,
                    {})),
      progressiveRenderingEnabled(
          ReactNativeFeatureFlags::enableCppPropsIteratorSetter()
              ? sourceProps.progressiveRenderingEnabled
              : convertRawProp(
                    context,
                    rawProps,
                    "progressiveRenderingEnabled",
                    sourceProps.progressiveRenderingEnabled,
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
    RAW_SET_PROP_SWITCH_CASE(defaultSource, "defaultSource");
    RAW_SET_PROP_SWITCH_CASE(loadingIndicatorSource, "loadingIndicatorSource");
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(blurRadius);
    RAW_SET_PROP_SWITCH_CASE_BASIC(capInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(tintColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(internal_analyticTag);
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMethod);
    RAW_SET_PROP_SWITCH_CASE_BASIC(resizeMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(shouldNotifyLoadEvents);
    RAW_SET_PROP_SWITCH_CASE_BASIC(overlayColor);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fadeDuration);
    RAW_SET_PROP_SWITCH_CASE_BASIC(progressiveRenderingEnabled);
  }
}

} // namespace facebook::react
