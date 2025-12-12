/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TransformHelper.h"

#include <react/renderer/components/view/BaseViewProps.h>
#include <react/renderer/components/view/conversions.h>

#include "NativeArray.h"

using namespace facebook::jni;

namespace facebook::react {

namespace {
void processTransform(
    jni::alias_ref<jclass> /*unused*/,
    NativeArray* jTransforms,
    jni::alias_ref<jni::JArrayDouble> jResult,
    float viewWidth,
    float viewHeight,
    NativeArray* jTransformOrigin) {
  // Assuming parsing transforms doesn't require a real PropsParserContext
  static ContextContainer contextContainer;
  static PropsParserContext context(0, contextContainer);

  RawValue transformValue(jTransforms->getArray());
  Transform transform;
  fromRawValue(context, transformValue, transform);

  TransformOrigin transformOrigin;
  if (jTransformOrigin != nullptr) {
    RawValue transformOriginValue(jTransformOrigin->getArray());
    fromRawValue(context, transformOriginValue, transformOrigin);
  }

  auto result = BaseViewProps::resolveTransform(
      Size{.width = viewWidth, .height = viewHeight},
      transform,
      transformOrigin);

  // Convert from matrix of floats to double matrix
  constexpr size_t MatrixSize = std::tuple_size_v<decltype(result.matrix)>;
  std::array<double, MatrixSize> doubleTransform{};
  std::copy(
      result.matrix.begin(), result.matrix.end(), doubleTransform.begin());
  jResult->setRegion(0, MatrixSize, doubleTransform.data());
}

} // namespace

void TransformHelper::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeProcessTransform", processTransform),
  });
}

} // namespace facebook::react
