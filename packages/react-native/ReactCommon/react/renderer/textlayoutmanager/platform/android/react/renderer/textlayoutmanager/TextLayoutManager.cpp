/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <span>
#include <utility>

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextLayoutManagerExtended.h>

namespace facebook::react {

static_assert(TextLayoutManagerExtended::supportsLineMeasurement());
static_assert(TextLayoutManagerExtended::supportsPreparedLayout());

namespace {

int countAttachments(const AttributedString& attributedString) {
  int count = 0;

  for (const auto& fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      count++;
    }
  }

  return count;
}

Size measureText(
    const ContextContainer::Shared& contextContainer,
    Tag rootTag,
    MapBuffer attributedString,
    MapBuffer paragraphAttributes,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject>& fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measureText");

  auto attributedStringBuffer =
      JReadableMapBuffer::createWithContents(std::move(attributedString));
  auto paragraphAttributesBuffer =
      JReadableMapBuffer::createWithContents(std::move(paragraphAttributes));

  return yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      attributedStringBuffer.get(),
      paragraphAttributesBuffer.get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));
}

TextMeasurement doMeasure(
    const ContextContainer::Shared& contextContainer,
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) {
  const int attachmentCount = countAttachments(attributedString);
  auto env = jni::Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  // We assume max height will have no effect on measurement, so we override it
  // with a constant value with no constraints, to enable cache reuse later down
  // in the stack.
  // TODO: This is suss, and not at the right layer
  maximumSize.height = std::numeric_limits<Float>::infinity();

  auto attributedStringMap = toMapBuffer(attributedString);
  auto paragraphAttributesMap = toMapBuffer(paragraphAttributes);

  auto size = measureText(
      contextContainer,
      layoutContext.surfaceId,
      std::move(attributedStringMap),
      std::move(paragraphAttributesMap),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat* attachmentDataElements =
      env->GetFloatArrayElements(attachmentPositions, nullptr /*isCopy*/);
  std::span<float> attachmentData{
      attachmentDataElements, static_cast<size_t>(attachmentCount * 2)};

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentCount > 0) {
    for (const auto& fragment : attributedString.getFragments()) {
      if (fragment.isAttachment()) {
        float top = attachmentData[attachments.size() * 2];
        float left = attachmentData[attachments.size() * 2 + 1];
        if (std::isnan(top) || std::isnan(left)) {
          attachments.push_back(
              TextMeasurement::Attachment{.frame = Rect{}, .isClipped = true});
        } else {
          float width =
              fragment.parentShadowView.layoutMetrics.frame.size.width;
          float height =
              fragment.parentShadowView.layoutMetrics.frame.size.height;

          auto rect = facebook::react::Rect{
              .origin = {.x = left, .y = top},
              .size = facebook::react::Size{.width = width, .height = height}};
          attachments.push_back(
              TextMeasurement::Attachment{.frame = rect, .isClipped = false});
        }
      }
    }
  }

  // Clean up allocated ref
  env->ReleaseFloatArrayElements(
      attachmentPositions, attachmentDataElements, JNI_ABORT);
  env->DeleteLocalRef(attachmentPositions);

  return TextMeasurement{.size = size, .attachments = attachments};
}

} // namespace

TextLayoutManager::TextLayoutManager(
    const ContextContainer::Shared& contextContainer)
    : contextContainer_(contextContainer),
      textMeasureCache_(kSimpleThreadSafeCacheSizeCap),
      lineMeasureCache_(kSimpleThreadSafeCacheSizeCap),
      preparedTextCache_(static_cast<size_t>(
          ReactNativeFeatureFlags::preparedTextCacheSize())) {}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto& attributedString = attributedStringBox.getValue();

  auto measureText = [&]() {
    auto telemetry = TransactionTelemetry::threadLocalTelemetry();
    if (telemetry != nullptr) {
      telemetry->willMeasureText();
    }

    auto measurement = doMeasure(
        contextContainer_,
        attributedString,
        paragraphAttributes,
        layoutContext,
        layoutConstraints);

    if (telemetry != nullptr) {
      telemetry->didMeasureText();
    }

    return measurement;
  };

  auto measurement =
      ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid()
      ? measureText()
      : textMeasureCache_.get(
            {.attributedString = attributedString,
             .paragraphAttributes = paragraphAttributes,
             .layoutConstraints = layoutConstraints},
            std::move(measureText));

  measurement.size = layoutConstraints.clamp(measurement.size);
  return measurement;
}

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t cacheId,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto env = jni::Environment::current();
  auto attachmentPositions = env->NewFloatArray(0);
  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto localDataBuilder = MapBufferBuilder();

  // TODO: this is always sourced from an int, and Java expects an int
  localDataBuilder.putInt(AS_KEY_CACHE_ID, static_cast<int32_t>(cacheId));

  auto size = measureText(
      contextContainer_,
      layoutContext.surfaceId,
      localDataBuilder.build(),
      toMapBuffer(paragraphAttributes),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  // Clean up allocated ref - it still takes up space in the JNI ref table even
  // though it's 0 length
  env->DeleteLocalRef(attachmentPositions);

  // TODO: currently we do not support attachments for cached IDs - should we?
  auto attachments = TextMeasurement::Attachments{};

  return TextMeasurement{size, attachments};
}

LinesMeasurements TextLayoutManager::measureLines(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const Size& size) const {
  react_native_assert(
      attributedStringBox.getMode() == AttributedStringBox::Mode::Value);
  const auto& attributedString = attributedStringBox.getValue();

  auto doMeasureLines = [&]() {
    const jni::global_ref<jobject>& fabricUIManager =
        contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
    static auto measureLines =
        jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
            ->getMethod<NativeArray::javaobject(
                JReadableMapBuffer::javaobject,
                JReadableMapBuffer::javaobject,
                jfloat,
                jfloat)>("measureLines");

    auto attributedStringMB =
        JReadableMapBuffer::createWithContents(toMapBuffer(attributedString));
    auto paragraphAttributesMB = JReadableMapBuffer::createWithContents(
        toMapBuffer(paragraphAttributes));

    auto array = measureLines(
        fabricUIManager,
        attributedStringMB.get(),
        paragraphAttributesMB.get(),
        size.width,
        size.height);

    auto dynamicArray = cthis(array)->consume();
    LinesMeasurements lineMeasurements;
    lineMeasurements.reserve(dynamicArray.size());

    for (const auto& data : dynamicArray) {
      lineMeasurements.emplace_back(data);
    }

    // Explicitly release smart pointers to free up space faster in JNI
    // tables
    attributedStringMB.reset();
    paragraphAttributesMB.reset();

    return lineMeasurements;
  };

  return ReactNativeFeatureFlags::disableTextLayoutManagerCacheAndroid()
      ? doMeasureLines()
      : lineMeasureCache_.get(
            {.attributedString = attributedString,
             .paragraphAttributes = paragraphAttributes,
             .size = size},
            std::move(doMeasureLines));
}

TextLayoutManager::PreparedLayout TextLayoutManager::prepareLayout(
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  static auto prepareTextLayout =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<JPreparedLayout::javaobject(
              jint,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat)>("prepareTextLayout");

  return preparedTextCache_.get(
      {.attributedString = attributedString,
       .paragraphAttributes = paragraphAttributes,
       .layoutConstraints = layoutConstraints},
      [&] {
        const auto& fabricUIManager =
            contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

        auto attributedStringMB = JReadableMapBuffer::createWithContents(
            toMapBuffer(attributedString));
        auto paragraphAttributesMB = JReadableMapBuffer::createWithContents(
            toMapBuffer(paragraphAttributes));

        auto minimumSize = layoutConstraints.minimumSize;
        auto maximumSize = layoutConstraints.maximumSize;

        return PreparedLayout{jni::make_global(prepareTextLayout(
            fabricUIManager,
            layoutContext.surfaceId,
            attributedStringMB.get(),
            paragraphAttributesMB.get(),
            minimumSize.width,
            maximumSize.width,
            minimumSize.height,
            maximumSize.height))};
      });
}

TextMeasurement TextLayoutManager::measurePreparedLayout(
    const PreparedLayout& preparedLayout,
    const TextLayoutContext& /*layoutContext*/,
    const LayoutConstraints& layoutConstraints) const {
  const auto& fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measurePreparedLayout =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jni::JArrayFloat(
              JPreparedLayout::javaobject, jfloat, jfloat, jfloat, jfloat)>(
              "measurePreparedLayout");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto measurementsArr = measurePreparedLayout(
      fabricUIManager,
      preparedLayout.get(),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height);
  auto measurements = measurementsArr->getRegion(
      0, static_cast<jsize>(measurementsArr->size()));

  react_native_assert(measurementsArr->size() >= 2);
  react_native_assert((measurementsArr->size() - 2) % 4 == 0);

  TextMeasurement textMeasurement;

  textMeasurement.size.width = measurements[0];
  textMeasurement.size.height = measurements[1];

  if (measurementsArr->size() > 2) {
    textMeasurement.attachments.reserve((measurementsArr->size() - 2) / 4);
    for (size_t i = 2; i < measurementsArr->size(); i += 4) {
      auto top = measurements[i];
      auto left = measurements[i + 1];
      auto width = measurements[i + 2];
      auto height = measurements[i + 3];

      if (std::isnan(top) || std::isnan(left)) {
        textMeasurement.attachments.push_back(
            TextMeasurement::Attachment{.frame = Rect{}, .isClipped = true});
      } else {
        textMeasurement.attachments.push_back(TextMeasurement::Attachment{
            .frame =
                {.origin = {.x = left, .y = top},
                 .size = {.width = width, .height = height}},
            .isClipped = false});
      }
    }
  }

  return textMeasurement;
}

} // namespace facebook::react
