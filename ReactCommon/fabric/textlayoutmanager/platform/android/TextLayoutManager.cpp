/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#include <react/attributedstring/conversions.h>
#include <react/jni/ReadableNativeMap.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
    Tag reactTag,
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->getInstance<jni::global_ref<jobject>>(
          "FabricUIManager");

  auto clazz =
      jni::findClassStatic("com/facebook/fbreact/fabric/FabricUIManager");
  static auto measure = clazz->getMethod<JArrayFloat::javaobject(
      jint,
      jstring,
      ReadableNativeMap::javaobject,
      ReadableNativeMap::javaobject,
      jint,
      jint)>("measure");

  int width = (int)layoutConstraints.maximumSize.width;
  int height = (int)layoutConstraints.maximumSize.height;
  local_ref<JString> componentName = make_jstring("RCTText");
  auto values = measure(
      fabricUIManager,
      reactTag,
      componentName.get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(attributedString)).get(),
      ReadableNativeMap::newObjectCxxArgs(toDynamic(paragraphAttributes)).get(),
      width,
      height);

  std::vector<float> indices;
  indices.resize(values->size());
  values->getRegion(0, values->size(), indices.data());

  return {(float)indices[0], (float)indices[1]};
}

} // namespace react
} // namespace facebook
