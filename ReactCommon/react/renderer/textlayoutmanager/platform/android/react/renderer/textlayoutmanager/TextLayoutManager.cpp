/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/core/conversions.h>

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

  return measureCache_.get(
      {attributedString, paragraphAttributes, layoutConstraints},
      [&](TextMeasureCacheKey const &key) {
        return doMeasure(
            attributedString, paragraphAttributes, layoutConstraints);
      });
}

TextMeasurement TextLayoutManager::measureCachedSpannableById(
    int64_t cacheId,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(0);

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  local_ref<JString> componentName = make_jstring("RCTText");
  folly::dynamic cacheIdMap = folly::dynamic::object;
  cacheIdMap["cacheId"] = cacheId;
  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(cacheIdMap);
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));
  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      -1, // TODO: we should pass rootTag in
      componentName.get(),
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions));

  // Clean up allocated ref - it still takes up space in the JNI ref table even
  // though it's 0 length
  env->DeleteLocalRef(attachmentPositions);

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentName.reset();
  attributedStringRM.reset();
  attributedStringRNM.reset();
  paragraphAttributesRM.reset();
  paragraphAttributesRNM.reset();

  // TODO: currently we do not support attachments for cached IDs - should we?
  auto attachments = TextMeasurement::Attachments{};

  return TextMeasurement{size, attachments};
}

LinesMeasurements TextLayoutManager::measureLines(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    Size size) const {
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

TextMeasurement TextLayoutManager::doMeasure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  int attachmentsCount = 0;
  for (auto fragment : attributedString.getFragments()) {
    if (fragment.isAttachment()) {
      attachmentsCount++;
    }
  }
  auto env = Environment::current();
  auto attachmentPositions = env->NewFloatArray(attachmentsCount * 2);

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jint,
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat,
              jfloatArray)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  auto serializedAttributedString = toDynamic(attributedString);
  local_ref<JString> componentName = make_jstring("RCTText");
  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(serializedAttributedString);
  local_ref<ReadableNativeMap::javaobject> paragraphAttributesRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes));

  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));
  local_ref<ReadableMap::javaobject> paragraphAttributesRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(paragraphAttributesRNM.get()));
  auto size = yogaMeassureToSize(measure(
      fabricUIManager,
      -1, // TODO: we should pass rootTag in
      componentName.get(),
      attributedStringRM.get(),
      paragraphAttributesRM.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height,
      attachmentPositions));

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

        auto rect = facebook::react::Rect{{left, top},
                                          facebook::react::Size{width, height}};
        attachments.push_back(TextMeasurement::Attachment{rect, false});
        attachmentIndex++;
      }
    }
  }

  // Clean up allocated ref
  env->ReleaseFloatArrayElements(
      attachmentPositions, attachmentData, JNI_ABORT);
  env->DeleteLocalRef(attachmentPositions);

  // Explicitly release smart pointers to free up space faster in JNI tables
  componentName.reset();
  attributedStringRM.reset();
  attributedStringRNM.reset();
  paragraphAttributesRM.reset();
  paragraphAttributesRNM.reset();

  return TextMeasurement{size, attachments};
}

} // namespace react
} // namespace facebook
