/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <limits>

#include <react/common/mapbuffer/JReadableMapBuffer.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>

using namespace facebook::jni;

namespace facebook::react {

static int countAttachments(const AttributedString& attributedString) {
  int count = 0;

  for (const auto& fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      count++;
    }
  }

  return count;
}

Size measureAndroidComponent(
    const ContextContainer::Shared& contextContainer,
    Tag rootTag,
    const std::string& componentName,
    MapBuffer localData,
    MapBuffer props,
    float minWidth,
    float maxWidth,
    float minHeight,
    float maxHeight,
    jfloatArray attachmentPositions) {
  const jni::global_ref<jobject>& fabricUIManager =
      contextContainer->at<jni::global_ref<jobject>>("FabricUIManager");
  auto componentNameRef = make_jstring(componentName);

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              JReadableMapBuffer::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measureMapBuffer");

  auto localDataMap =
      JReadableMapBuffer::createWithContents(std::move(localData));
  auto propsMap = JReadableMapBuffer::createWithContents(std::move(props));

  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      rootTag,
      componentNameRef.get(),
      localDataMap.get(),
      propsMap.get(),
      nullptr,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      attachmentPositions));

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentNameRef.reset();
  localDataMap.reset();
  propsMap.reset();
  return size;
}

TextLayoutManager::TextLayoutManager(
    const ContextContainer::Shared& contextContainer)
    : contextContainer_(contextContainer),
      measureCache_(kSimpleThreadSafeCacheSizeCap) {}

void* TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    const AttributedStringBox& attributedStringBox,
    const ParagraphAttributes& paragraphAttributes,
    const TextLayoutContext& layoutContext,
    LayoutConstraints layoutConstraints) const {
  auto& attributedString = attributedStringBox.getValue();

  auto measurement = measureCache_.get(
      {attributedString, paragraphAttributes, layoutConstraints},
      [&](const TextMeasureCacheKey& /*key*/) {
        auto telemetry = TransactionTelemetry::threadLocalTelemetry();
        if (telemetry != nullptr) {
          telemetry->willMeasureText();
        }

        auto measurement =
            doMeasure(attributedString, paragraphAttributes, layoutConstraints);

        if (telemetry != nullptr) {
          telemetry->didMeasureText();
        }

        return measurement;
      });

  measurement.size = layoutConstraints.clamp(measurement.size);
  return measurement;
}

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t cacheId,
    const ParagraphAttributes& paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(0);
  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto localDataBuilder = MapBufferBuilder();

  // TODO: this is always sourced from an int, and Java expects an int
  localDataBuilder.putInt(AS_KEY_CACHE_ID, static_cast<int32_t>(cacheId));

  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "RCTText",
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
    const AttributedString& attributedString,
    const ParagraphAttributes& paragraphAttributes,
    Size size) const {
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
  auto paragraphAttributesMB =
      JReadableMapBuffer::createWithContents(toMapBuffer(paragraphAttributes));

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
    lineMeasurements.push_back(LineMeasurement(data));
  }

  // Explicitly release smart pointers to free up space faster in JNI tables
  attributedStringMB.reset();
  paragraphAttributesMB.reset();

  return lineMeasurements;
}

TextMeasurement TextLayoutManager::doMeasure(
    AttributedString attributedString,
    const ParagraphAttributes& paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  layoutConstraints.maximumSize.height = std::numeric_limits<Float>::infinity();

  const int attachmentCount = countAttachments(attributedString);
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto attributedStringMap = toMapBuffer(attributedString);
  auto paragraphAttributesMap = toMapBuffer(paragraphAttributes);

  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "RCTText",
      std::move(attributedStringMap),
      std::move(paragraphAttributesMap),
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat* attachmentData =
      env->GetFloatArrayElements(attachmentPositions, nullptr);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentCount > 0) {
    int attachmentIndex = 0;
    for (const auto& fragment : attributedString.getFragments()) {
      if (fragment.isAttachment()) {
        float top = attachmentData[attachmentIndex * 2];
        float left = attachmentData[attachmentIndex * 2 + 1];
        float width = fragment.parentShadowView.layoutMetrics.frame.size.width;
        float height =
            fragment.parentShadowView.layoutMetrics.frame.size.height;

        auto rect = facebook::react::Rect{
            {left, top}, facebook::react::Size{width, height}};
        attachments.push_back(TextMeasurement::Attachment{rect, false});
        attachmentIndex++;
      }
    }
  }

  // Clean up allocated ref
  env->ReleaseFloatArrayElements(
      attachmentPositions, attachmentData, JNI_ABORT);
  env->DeleteLocalRef(attachmentPositions);

  return TextMeasurement{size, attachments};
}

} // namespace facebook::react
