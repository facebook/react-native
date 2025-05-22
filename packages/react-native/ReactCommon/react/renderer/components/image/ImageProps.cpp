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

#ifdef RN_SERIALIZABLE_STATE

static folly::dynamic convertImageSource(const ImageSource& imageSource) {
  folly::dynamic imageSourceResult = folly::dynamic::object();
  switch (imageSource.type) {
    case ImageSource::Type::Invalid:
      imageSourceResult["type"] = "invalid";
      break;
    case ImageSource::Type::Remote:
      imageSourceResult["type"] = "remote";
      break;
    case ImageSource::Type::Local:
      imageSourceResult["type"] = "local";
      break;
  }

  imageSourceResult["uri"] = imageSource.uri;
  imageSourceResult["bundle"] = imageSource.bundle;
  imageSourceResult["scale"] = imageSource.scale;

  imageSourceResult["width"] = imageSource.size.width;
  imageSourceResult["height"] = imageSource.size.height;

  imageSourceResult["body"] = imageSource.body;
  imageSourceResult["method"] = imageSource.method;

  switch (imageSource.cache) {
    case ImageSource::CacheStategy::Default:
      imageSourceResult["cache"] = "default";
      break;
    case ImageSource::CacheStategy::Reload:
      imageSourceResult["cache"] = "reload";
      break;
    case ImageSource::CacheStategy::ForceCache:
      imageSourceResult["cache"] = "force-cache";
      break;
    case ImageSource::CacheStategy::OnlyIfCached:
      imageSourceResult["cache"] = "only-if-cached";
      break;
  }

  folly::dynamic headersObject = folly::dynamic::object();
  for (const auto& header : imageSource.headers) {
    headersObject[header.first] = header.second;
  }
  imageSourceResult["headers"] = headersObject;
  return imageSourceResult;
}

static folly::dynamic convertEdgeInsets(const EdgeInsets& edgeInsets) {
  folly::dynamic edgeInsetsResult = folly::dynamic::object();
  edgeInsetsResult["left"] = edgeInsets.left;
  edgeInsetsResult["top"] = edgeInsets.top;
  edgeInsetsResult["right"] = edgeInsets.right;
  edgeInsetsResult["bottom"] = edgeInsets.bottom;
  return edgeInsetsResult;
}

folly::dynamic ImageProps::getDiffProps(const Props* prevProps) const {
  static const auto defaultProps = ImageProps();

  const ImageProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const ImageProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  if (sources != oldProps->sources) {
    auto sourcesArray = folly::dynamic::array();
    for (const auto& source : sources) {
      sourcesArray.push_back(convertImageSource(source));
    }
    result["source"] = sourcesArray;
  }

  if (defaultSource != oldProps->defaultSource) {
    result["defaultSource"] = convertImageSource(defaultSource);
  }

  if (loadingIndicatorSource != oldProps->loadingIndicatorSource) {
    result["loadingIndicatorSource"] =
        convertImageSource(loadingIndicatorSource);
  }

  if (resizeMode != oldProps->resizeMode) {
    switch (resizeMode) {
      case ImageResizeMode::Cover:
        result["resizeMode"] = "cover";
        break;
      case ImageResizeMode::Contain:
        result["resizeMode"] = "contain";
        break;
      case ImageResizeMode::Stretch:
        result["resizeMode"] = "stretch";
        break;
      case ImageResizeMode::Center:
        result["resizeMode"] = "center";
        break;
      case ImageResizeMode::Repeat:
        result["resizeMode"] = "repeat";
        break;
      case ImageResizeMode::None:
        result["resizeMode"] = "none";
        break;
    }
  }

  if (blurRadius != oldProps->blurRadius) {
    result["blurRadius"] = blurRadius;
  }

  if (capInsets != oldProps->capInsets) {
    result["capInsets"] = convertEdgeInsets(capInsets);
  }

  if (tintColor != oldProps->tintColor) {
    result["tintColor"] = *tintColor;
  }

  if (internal_analyticTag != oldProps->internal_analyticTag) {
    result["internal_analyticTag"] = internal_analyticTag;
  }

  if (resizeMethod != oldProps->resizeMethod) {
    result["resizeMethod"] = resizeMethod;
  }

  if (resizeMultiplier != oldProps->resizeMultiplier) {
    result["resizeMultiplier"] = resizeMultiplier;
  }

  if (shouldNotifyLoadEvents != oldProps->shouldNotifyLoadEvents) {
    result["shouldNotifyLoadEvents"] = shouldNotifyLoadEvents;
  }

  if (overlayColor != oldProps->overlayColor) {
    result["overlayColor"] = *overlayColor;
  }

  if (fadeDuration != oldProps->fadeDuration) {
    result["fadeDuration"] = fadeDuration;
  }

  if (progressiveRenderingEnabled != oldProps->progressiveRenderingEnabled) {
    result["progressiveRenderingEnabled"] = progressiveRenderingEnabled;
  }

  return result;
}

#endif

} // namespace facebook::react
