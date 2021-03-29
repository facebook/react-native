/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <limits>

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/utils/LayoutManager.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto &attributedString = attributedStringBox.getValue();

  auto measurement = measureCache_.get(
      {attributedString, paragraphAttributes, layoutConstraints},
      [&](TextMeasureCacheKey const &key) {
        auto telemetry = TransactionTelemetry::threadLocalTelemetry();
        if (telemetry) {
          telemetry->willMeasureText();
        }

        auto measurement = mapBufferSerializationEnabled_
            ? doMeasureMapBuffer(
                  attributedString, paragraphAttributes, layoutConstraints)
            : doMeasure(
                  attributedString, paragraphAttributes, layoutConstraints);

        if (telemetry) {
          telemetry->didMeasureText();
        }

        return measurement;
      });

  measurement.size = layoutConstraints.clamp(measurement.size);
  return measurement;
}

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t cacheId,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(0);
  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  folly::dynamic cacheIdMap = folly::dynamic::object;
  cacheIdMap["cacheId"] = cacheId;

  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "RCTText",
      cacheIdMap,
      toDynamic(paragraphAttributes),
      nullptr,
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
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    Size size) const {
  if (mapBufferSerializationEnabled_) {
    return measureLinesMapBuffer(attributedString, paragraphAttributes, size);
  }

  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto measureLines =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<NativeArray::javaobject(
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat)>("measureLines");

  auto serializedAttributedString = toDynamic(attributedString);

  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(serializedAttributedString);
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));

  auto array = measureLines(
      fabricUIManager,
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      size.width,
      size.height);

  auto dynamicArray = cthis(array)->consume();
  LinesMeasurements lineMeasurements;
  lineMeasurements.reserve(dynamicArray.size());

  for (auto const &data : dynamicArray) {
    lineMeasurements.push_back(LineMeasurement(data));
  }

  // Explicitly release smart pointers to free up space faster in JNI tables
  attributedStringRM.reset();
  attributedStringRNM.reset();
  paragraphAttributesRM.reset();
  paragraphAttributesRNM.reset();

  return lineMeasurements;
}

LinesMeasurements TextLayoutManager::measureLinesMapBuffer(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    Size size) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");
  static auto measureLines =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<NativeArray::javaobject(
              ReadableMapBuffer::javaobject,
              ReadableMapBuffer::javaobject,
              jfloat,
              jfloat)>("measureLinesMapBuffer");

  auto attributedStringMB =
      ReadableMapBuffer::createWithContents(toMapBuffer(attributedString));
  auto paragraphAttributesMB =
      ReadableMapBuffer::createWithContents(toMapBuffer(paragraphAttributes));

  auto array = measureLines(
      fabricUIManager,
      attributedStringMB.get(),
      paragraphAttributesMB.get(),
      size.width,
      size.height);

  auto dynamicArray = cthis(array)->consume();
  LinesMeasurements lineMeasurements;
  lineMeasurements.reserve(dynamicArray.size());

  for (auto const &data : dynamicArray) {
    lineMeasurements.push_back(LineMeasurement(data));
  }

  // Explicitly release smart pointers to free up space faster in JNI tables
  attributedStringMB.reset();
  paragraphAttributesMB.reset();

  return lineMeasurements;
}

TextMeasurement TextLayoutManager::doMeasure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  layoutConstraints.maximumSize.height = std::numeric_limits<Float>::infinity();

  int attachmentsCount = 0;
  for (auto fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentsCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto serializedAttributedString = toDynamic(attributedString);
  auto size = measureAndroidComponent(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "RCTText",
      serializedAttributedString,
      toDynamic(paragraphAttributes),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat *attachmentData = env->GetFloatArrayElements(attachmentPositions, 0);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentsCount > 0) {
    folly::dynamic fragments = serializedAttributedString["fragments"];
    int attachmentIndex = 0;
    for (int i = 0; i < fragments.size(); i++) {
      folly::dynamic fragment = fragments[i];
      if (fragment["isAttachment"] == true) {
        float top = attachmentData[attachmentIndex * 2];
        float left = attachmentData[attachmentIndex * 2 + 1];
        float width = (float)fragment["width"].getDouble();
        float height = (float)fragment["height"].getDouble();

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

TextMeasurement TextLayoutManager::doMeasureMapBuffer(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  layoutConstraints.maximumSize.height = std::numeric_limits<Float>::infinity();

  int attachmentsCount = 0;
  for (auto fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentsCount * 2);

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto attributedStringMap = toMapBuffer(attributedString);
  auto paragraphAttributesMap = toMapBuffer(paragraphAttributes);

  auto size = measureAndroidComponentMapBuffer(
      contextContainer_,
      -1, // TODO: we should pass rootTag in
      "RCTText",
      attributedStringMap,
      paragraphAttributesMap,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions);

  jfloat *attachmentData = env->GetFloatArrayElements(attachmentPositions, 0);

  auto attachments = TextMeasurement::Attachments{};
  if (attachmentsCount > 0) {
    int attachmentIndex = 0;
    for (auto fragment : attributedString.getFragments()) {
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

} // namespace react
} // namespace facebook
