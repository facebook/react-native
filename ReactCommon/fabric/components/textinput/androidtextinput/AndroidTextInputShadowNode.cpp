/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputShadowNode.h"

#include <fb/fbjni.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/components/text/BaseTextShadowNode.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>
#include <react/core/conversions.h>
#include <react/jni/ReadableNativeMap.h>

#include <Glog/logging.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

extern const char AndroidTextInputComponentName[] = "AndroidTextInput";

void AndroidTextInputShadowNode::setContextContainer(
    ContextContainer *contextContainer) {
  ensureUnsealed();
  contextContainer_ = contextContainer;
}

AttributedString AndroidTextInputShadowNode::getAttributedString() const {
  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.apply(getProps()->textAttributes);

  // Use BaseTextShadowNode to get attributed string from children
  return BaseTextShadowNode::getAttributedString(textAttributes, *this);
}

#pragma mark - LayoutableShadowNode

Size AndroidTextInputShadowNode::measure(
    LayoutConstraints layoutConstraints) const {
  AttributedString attributedString = getAttributedString();

  if (attributedString.isEmpty()) {
    return {0, 0};
  }

  const jni::global_ref<jobject> &fabricUIManager =
      contextContainer_->at<jni::global_ref<jobject>>("FabricUIManager");

  static auto measure =
      jni::findClassStatic("com/facebook/react/fabric/FabricUIManager")
          ->getMethod<jlong(
              jstring,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              ReadableMap::javaobject,
              jfloat,
              jfloat,
              jfloat,
              jfloat)>("measure");

  auto minimumSize = layoutConstraints.minimumSize;
  auto maximumSize = layoutConstraints.maximumSize;

  local_ref<JString> componentName =
      make_jstring(AndroidTextInputComponentName);

  local_ref<ReadableNativeMap::javaobject> attributedStringRNM =
      ReadableNativeMap::newObjectCxxArgs(toDynamic(attributedString));
  local_ref<ReadableMap::javaobject> attributedStringRM = make_local(
      reinterpret_cast<ReadableMap::javaobject>(attributedStringRNM.get()));

  local_ref<ReadableNativeMap::javaobject> nativeLocalProps = make_local(
      ReadableNativeMap::createWithContents(getProps()->getDynamic()));
  local_ref<ReadableMap::javaobject> props = make_local(
      reinterpret_cast<ReadableMap::javaobject>(nativeLocalProps.get()));

  // For AndroidTextInput purposes:
  // localData == textAttributes
  return yogaMeassureToSize(measure(
      fabricUIManager,
      componentName.get(),
      attributedStringRM.get(),
      props.get(),
      nullptr,
      minimumSize.width,
      maximumSize.width,
      minimumSize.height,
      maximumSize.height));
}

void AndroidTextInputShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
