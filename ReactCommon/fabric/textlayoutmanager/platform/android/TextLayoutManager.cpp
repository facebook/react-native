/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <react/attributedstring/conversions.h>
#include <react/core/conversions.h>
#include <react/jni/ReadableNativeMap.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->getInstance<jni::global_ref<jobject>>(
          "FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jstring,
              ReadableNativeMap::javaobject,
              ReadableNativeMap::javaobject,
              jint,
              jint,
              jint,
              jint)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;
  int minWidth = (int)minimumSize.width;
  int minHeight = (int)minimumSize.height;
  int maxWidth = (int)maximumSize.width;
  int maxHeight = (int)maximumSize.height;
  local_ref<JString> componentName = make_jstring("RCTText");
  return yogaMeassureToSize(measure(
      fabricUIManager,
      componentName.get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(attributedString)).get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes)).get(),
      minWidth,
      maxWidth,
      minHeight,
      maxHeight));
}

} // namespace react
} // namespace facebook
