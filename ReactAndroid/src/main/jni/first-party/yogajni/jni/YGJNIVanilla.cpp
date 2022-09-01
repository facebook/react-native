/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "jni.h"
#include "YGJNIVanilla.h"
#include <yoga/YGNode.h>
#include <cstring>
#include "YGJNI.h"
#include "common.h"
#include "YGJTypesVanilla.h"
#include <yoga/log.h>
#include <iostream>
#include <memory>
#include "YogaJniException.h"

using namespace facebook::yoga::vanillajni;
using facebook::yoga::detail::Log;

static inline ScopedLocalRef<jobject> YGNodeJobject(
    YGNodeRef node,
    void* layoutContext) {
  return reinterpret_cast<PtrJNodeMapVanilla*>(layoutContext)->ref(node);
}

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
}

static inline YGConfigRef _jlong2YGConfigRef(jlong addr) {
  return reinterpret_cast<YGConfigRef>(static_cast<intptr_t>(addr));
}

static jlong jni_YGConfigNewJNI(JNIEnv* env, jobject obj) {
  return reinterpret_cast<jlong>(YGConfigNew());
}

static void jni_YGConfigFreeJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  // unique_ptr will destruct the underlying global_ref, if present.
  auto context = std::unique_ptr<ScopedGlobalRef<jobject>>{
      static_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config))};
  YGConfigFree(config);
}

static void jni_YGConfigSetExperimentalFeatureEnabledJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint feature,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetExperimentalFeatureEnabled(
      config, static_cast<YGExperimentalFeature>(feature), enabled);
}

static void jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviourJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(config, enabled);
}

static void jni_YGConfigSetUseWebDefaultsJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean useWebDefaults) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseWebDefaults(config, useWebDefaults);
}

static void jni_YGConfigSetPrintTreeFlagJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean enable) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPrintTreeFlag(config, enable);
}

static void jni_YGConfigSetPointScaleFactorJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jfloat pixelsInPoint) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPointScaleFactor(config, pixelsInPoint);
}

static void YGPrint(YGNodeRef node, void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    // TODO cout << obj.get()->toString() << endl;
  } else {
    Log::log(
        node,
        YGLogLevelError,
        nullptr,
        "Java YGNode was GCed during layout calculation\n");
  }
}

static void jni_YGConfigSetUseLegacyStretchBehaviourJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean useLegacyStretchBehaviour) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseLegacyStretchBehaviour(config, useLegacyStretchBehaviour);
}

static jlong jni_YGNodeNewJNI(JNIEnv* env, jobject obj) {
  const YGNodeRef node = YGNodeNew();
  node->setContext(YGNodeContext{}.asVoidPtr);
  node->setPrintFunc(YGPrint);
  return reinterpret_cast<jlong>(node);
}

static jlong jni_YGNodeNewWithConfigJNI(
    JNIEnv* env,
    jobject obj,
    jlong configPointer) {
  const YGNodeRef node = YGNodeNewWithConfig(_jlong2YGConfigRef(configPointer));
  node->setContext(YGNodeContext{}.asVoidPtr);
  return reinterpret_cast<jlong>(node);
}

static int YGJNILogFunc(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    void* layoutContext,
    const char* format,
    va_list args) {
  int result = vsnprintf(NULL, 0, format, args);
  std::vector<char> buffer(1 + result);
  vsnprintf(buffer.data(), buffer.size(), format, args);

  auto jloggerPtr =
      static_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config));
  if (jloggerPtr != nullptr) {
    if (*jloggerPtr) {
      JNIEnv* env = getCurrentEnv();

      jclass cl = env->FindClass("com/facebook/yoga/YogaLogLevel");
      static const jmethodID smethodId =
          facebook::yoga::vanillajni::getStaticMethodId(
              env, cl, "fromInt", "(I)Lcom/facebook/yoga/YogaLogLevel;");
      ScopedLocalRef<jobject> logLevel =
          facebook::yoga::vanillajni::callStaticObjectMethod(
              env, cl, smethodId, level);

      auto objectClass = facebook::yoga::vanillajni::make_local_ref(
          env, env->GetObjectClass((*jloggerPtr).get()));
      static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
          env,
          objectClass.get(),
          "log",
          "(Lcom/facebook/yoga/YogaLogLevel;Ljava/lang/String;)V");
      facebook::yoga::vanillajni::callVoidMethod(
          env,
          (*jloggerPtr).get(),
          methodId,
          logLevel.get(),
          env->NewStringUTF(buffer.data()));
    }
  }

  return result;
}

static void jni_YGConfigSetLoggerJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jobject logger) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  auto context =
      reinterpret_cast<ScopedGlobalRef<jobject>*>(YGConfigGetContext(config));

  if (logger) {
    if (context == nullptr) {
      context = new ScopedGlobalRef<jobject>();
      YGConfigSetContext(config, context);
    }

    *context = newGlobalRef(env, logger);
    config->setLogger(YGJNILogFunc);
  } else {
    if (context != nullptr) {
      delete context;
      YGConfigSetContext(config, nullptr);
    }
    YGConfigSetLogger(config, nullptr);
  }
}

static void jni_YGNodeFreeJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
  if (nativePointer == 0) {
    return;
  }
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodeFree(node);
}

static void jni_YGNodeResetJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  void* context = node->getContext();
  YGNodeReset(node);
  node->setContext(context);
}

static void jni_YGNodeInsertChildJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeInsertChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer), index);
}

static void jni_YGNodeSwapChildJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeSwapChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer), index);
}

static void jni_YGNodeSetIsReferenceBaselineJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean isReferenceBaseline) {
  YGNodeSetIsReferenceBaseline(
      _jlong2YGNodeRef(nativePointer), isReferenceBaseline);
}

static jboolean jni_YGNodeIsReferenceBaselineJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer) {
  return YGNodeIsReferenceBaseline(_jlong2YGNodeRef(nativePointer));
}

static void jni_YGNodeClearChildrenJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  node->clearChildren();
}

static void jni_YGNodeRemoveChildJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jlong childPointer) {
  YGNodeRemoveChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer));
}

static void YGTransferLayoutOutputsRecursive(
    JNIEnv* env,
    jobject thiz,
    YGNodeRef root,
    void* layoutContext) {
  if (!root->getHasNewLayout()) {
    return;
  }
  auto obj = YGNodeJobject(root, layoutContext);
  if (!obj) {
    Log::log(
        root,
        YGLogLevelError,
        nullptr,
        "Java YGNode was GCed during layout calculation\n");
    return;
  }

  auto edgesSet = YGNodeEdges{root};

  bool marginFieldSet = edgesSet.has(YGNodeEdges::MARGIN);
  bool paddingFieldSet = edgesSet.has(YGNodeEdges::PADDING);
  bool borderFieldSet = edgesSet.has(YGNodeEdges::BORDER);

  int fieldFlags = edgesSet.get();
  fieldFlags |= HAS_NEW_LAYOUT;
  if (YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(root)) {
    fieldFlags |= DOES_LEGACY_STRETCH_BEHAVIOUR;
  }

  const int arrSize = 6 + (marginFieldSet ? 4 : 0) + (paddingFieldSet ? 4 : 0) +
      (borderFieldSet ? 4 : 0);
  float arr[18];
  arr[LAYOUT_EDGE_SET_FLAG_INDEX] = fieldFlags;
  arr[LAYOUT_WIDTH_INDEX] = YGNodeLayoutGetWidth(root);
  arr[LAYOUT_HEIGHT_INDEX] = YGNodeLayoutGetHeight(root);
  arr[LAYOUT_LEFT_INDEX] = YGNodeLayoutGetLeft(root);
  arr[LAYOUT_TOP_INDEX] = YGNodeLayoutGetTop(root);
  arr[LAYOUT_DIRECTION_INDEX] =
      static_cast<jint>(YGNodeLayoutGetDirection(root));
  if (marginFieldSet) {
    arr[LAYOUT_MARGIN_START_INDEX] = YGNodeLayoutGetMargin(root, YGEdgeLeft);
    arr[LAYOUT_MARGIN_START_INDEX + 1] = YGNodeLayoutGetMargin(root, YGEdgeTop);
    arr[LAYOUT_MARGIN_START_INDEX + 2] =
        YGNodeLayoutGetMargin(root, YGEdgeRight);
    arr[LAYOUT_MARGIN_START_INDEX + 3] =
        YGNodeLayoutGetMargin(root, YGEdgeBottom);
  }
  if (paddingFieldSet) {
    int paddingStartIndex =
        LAYOUT_PADDING_START_INDEX - (marginFieldSet ? 0 : 4);
    arr[paddingStartIndex] = YGNodeLayoutGetPadding(root, YGEdgeLeft);
    arr[paddingStartIndex + 1] = YGNodeLayoutGetPadding(root, YGEdgeTop);
    arr[paddingStartIndex + 2] = YGNodeLayoutGetPadding(root, YGEdgeRight);
    arr[paddingStartIndex + 3] = YGNodeLayoutGetPadding(root, YGEdgeBottom);
  }

  if (borderFieldSet) {
    int borderStartIndex = LAYOUT_BORDER_START_INDEX -
        (marginFieldSet ? 0 : 4) - (paddingFieldSet ? 0 : 4);
    arr[borderStartIndex] = YGNodeLayoutGetBorder(root, YGEdgeLeft);
    arr[borderStartIndex + 1] = YGNodeLayoutGetBorder(root, YGEdgeTop);
    arr[borderStartIndex + 2] = YGNodeLayoutGetBorder(root, YGEdgeRight);
    arr[borderStartIndex + 3] = YGNodeLayoutGetBorder(root, YGEdgeBottom);
  }

  // Don't change this field name without changing the name of the field in
  // Database.java
  auto objectClass = facebook::yoga::vanillajni::make_local_ref(
      env, env->GetObjectClass(obj.get()));
  static const jfieldID arrField = facebook::yoga::vanillajni::getFieldId(
      env, objectClass.get(), "arr", "[F");

  ScopedLocalRef<jfloatArray> arrFinal =
      make_local_ref(env, env->NewFloatArray(arrSize));
  env->SetFloatArrayRegion(arrFinal.get(), 0, arrSize, arr);
  env->SetObjectField(obj.get(), arrField, arrFinal.get());

  root->setHasNewLayout(false);

  for (uint32_t i = 0; i < YGNodeGetChildCount(root); i++) {
    YGTransferLayoutOutputsRecursive(
        env, thiz, YGNodeGetChild(root, i), layoutContext);
  }
}

static void jni_YGNodeCalculateLayoutJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jfloat width,
    jfloat height,
    jlongArray nativePointers,
    jobjectArray javaNodes) {

  try {
    void* layoutContext = nullptr;
    auto map = PtrJNodeMapVanilla{};
    if (nativePointers) {
      map = PtrJNodeMapVanilla{nativePointers, javaNodes};
      layoutContext = &map;
    }

    const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
    YGNodeCalculateLayoutWithContext(
        root,
        static_cast<float>(width),
        static_cast<float>(height),
        YGNodeStyleGetDirection(_jlong2YGNodeRef(nativePointer)),
        layoutContext);
    YGTransferLayoutOutputsRecursive(env, obj, root, layoutContext);
  } catch (const YogaJniException& jniException) {
    ScopedLocalRef<jthrowable> throwable = jniException.getThrowable();
    if (throwable.get()) {
      env->Throw(throwable.get());
    }
  } catch (const std::logic_error& ex) {
    env->ExceptionClear();
    jclass cl = env->FindClass("java/lang/IllegalStateException");
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, cl, "<init>", "(Ljava/lang/String;)V");
    auto throwable = env->NewObject(cl, methodId, env->NewStringUTF(ex.what()));
    env->Throw(static_cast<jthrowable>(throwable));
  }
}

static void jni_YGNodeMarkDirtyJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer) {
  YGNodeMarkDirty(_jlong2YGNodeRef(nativePointer));
}

static void jni_YGNodeMarkDirtyAndPropogateToDescendantsJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer) {
  YGNodeMarkDirtyAndPropogateToDescendants(_jlong2YGNodeRef(nativePointer));
}

static jboolean jni_YGNodeIsDirtyJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer) {
  return (jboolean) _jlong2YGNodeRef(nativePointer)->isDirty();
}

static void jni_YGNodeCopyStyleJNI(
    JNIEnv* env,
    jobject obj,
    jlong dstNativePointer,
    jlong srcNativePointer) {
  YGNodeCopyStyle(
      _jlong2YGNodeRef(dstNativePointer), _jlong2YGNodeRef(srcNativePointer));
}

#define YG_NODE_JNI_STYLE_PROP(javatype, type, name)                         \
  static javatype jni_YGNodeStyleGet##name##JNI(                             \
      JNIEnv* env, jobject obj, jlong nativePointer) {                       \
    return (javatype) YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)); \
  }                                                                          \
                                                                             \
  static void jni_YGNodeStyleSet##name##JNI(                                 \
      JNIEnv* env, jobject obj, jlong nativePointer, javatype value) {       \
    YGNodeStyleSet##name(                                                    \
        _jlong2YGNodeRef(nativePointer), static_cast<type>(value));          \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP(name)                            \
  static jlong jni_YGNodeStyleGet##name##JNI(                        \
      JNIEnv* env, jobject obj, jlong nativePointer) {               \
    return YogaValue::asJavaLong(                                    \
        YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)));      \
  }                                                                  \
                                                                     \
  static void jni_YGNodeStyleSet##name##JNI(                         \
      JNIEnv* env, jobject obj, jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name(                                            \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value)); \
  }                                                                  \
                                                                     \
  static void jni_YGNodeStyleSet##name##PercentJNI(                  \
      JNIEnv* env, jobject obj, jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name##Percent(                                   \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value)); \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(name)                   \
  YG_NODE_JNI_STYLE_UNIT_PROP(name)                              \
  static void jni_YGNodeStyleSet##name##AutoJNI(                 \
      JNIEnv* env, jobject obj, jlong nativePointer) {           \
    YGNodeStyleSet##name##Auto(_jlong2YGNodeRef(nativePointer)); \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                        \
  static jlong jni_YGNodeStyleGet##name##JNI(                         \
      JNIEnv* env, jobject obj, jlong nativePointer, jint edge) {     \
    return YogaValue::asJavaLong(YGNodeStyleGet##name(                \
        _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge))); \
  }                                                                   \
                                                                      \
  static void jni_YGNodeStyleSet##name##JNI(                          \
      JNIEnv* env,                                                    \
      jobject obj,                                                    \
      jlong nativePointer,                                            \
      jint edge,                                                      \
      jfloat value) {                                                 \
    YGNodeStyleSet##name(                                             \
        _jlong2YGNodeRef(nativePointer),                              \
        static_cast<YGEdge>(edge),                                    \
        static_cast<float>(value));                                   \
  }                                                                   \
                                                                      \
  static void jni_YGNodeStyleSet##name##PercentJNI(                   \
      JNIEnv* env,                                                    \
      jobject obj,                                                    \
      jlong nativePointer,                                            \
      jint edge,                                                      \
      jfloat value) {                                                 \
    YGNodeStyleSet##name##Percent(                                    \
        _jlong2YGNodeRef(nativePointer),                              \
        static_cast<YGEdge>(edge),                                    \
        static_cast<float>(value));                                   \
  }

YG_NODE_JNI_STYLE_PROP(jint, YGDirection, Direction);
YG_NODE_JNI_STYLE_PROP(jint, YGFlexDirection, FlexDirection);
YG_NODE_JNI_STYLE_PROP(jint, YGJustify, JustifyContent);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignItems);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignSelf);
YG_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignContent);
YG_NODE_JNI_STYLE_PROP(jint, YGPositionType, PositionType);
YG_NODE_JNI_STYLE_PROP(jint, YGWrap, FlexWrap);
YG_NODE_JNI_STYLE_PROP(jint, YGOverflow, Overflow);
YG_NODE_JNI_STYLE_PROP(jint, YGDisplay, Display);
YG_NODE_JNI_STYLE_PROP(jfloat, float, Flex);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);

YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(FlexBasis);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Width);
YG_NODE_JNI_STYLE_UNIT_PROP(MinWidth);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxWidth);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Height);
YG_NODE_JNI_STYLE_UNIT_PROP(MinHeight);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxHeight);

YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Position);

static jlong jni_YGNodeStyleGetMarginJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::MARGIN)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetMargin(yogaNodeRef, static_cast<YGEdge>(edge)));
}

static void jni_YGNodeStyleSetMarginJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge,
    jfloat margin) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMargin(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(margin));
}

static void jni_YGNodeStyleSetMarginPercentJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

static void jni_YGNodeStyleSetMarginAutoJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginAuto(yogaNodeRef, static_cast<YGEdge>(edge));
}

static jlong jni_YGNodeStyleGetPaddingJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::PADDING)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetPadding(yogaNodeRef, static_cast<YGEdge>(edge)));
}

static void jni_YGNodeStyleSetPaddingJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge,
    jfloat padding) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPadding(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(padding));
}

static void jni_YGNodeStyleSetPaddingPercentJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPaddingPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

static jfloat jni_YGNodeStyleGetBorderJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::BORDER)) {
    return (jfloat) YGUndefined;
  }
  return (jfloat) YGNodeStyleGetBorder(yogaNodeRef, static_cast<YGEdge>(edge));
}

static void jni_YGNodeStyleSetBorderJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jint edge,
    jfloat border) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::BORDER).setOn(yogaNodeRef);
  YGNodeStyleSetBorder(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(border));
}

static void YGTransferLayoutDirection(YGNodeRef node, jobject javaNode) {
  // Don't change this field name without changing the name of the field in
  // Database.java
  JNIEnv* env = getCurrentEnv();
  auto objectClass = facebook::yoga::vanillajni::make_local_ref(
      env, env->GetObjectClass(javaNode));
  static const jfieldID layoutDirectionField =
      facebook::yoga::vanillajni::getFieldId(
          env, objectClass.get(), "mLayoutDirection", "I");
  env->SetIntField(
      javaNode,
      layoutDirectionField,
      static_cast<jint>(YGNodeLayoutGetDirection(node)));
}

static YGSize YGJNIMeasureFunc(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode,
    void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    YGTransferLayoutDirection(node, obj.get());
    JNIEnv* env = getCurrentEnv();
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, objectClass.get(), "measure", "(FIFI)J");
    const auto measureResult = facebook::yoga::vanillajni::callLongMethod(
        env, obj.get(), methodId, width, widthMode, height, heightMode);

    static_assert(
        sizeof(measureResult) == 8,
        "Expected measureResult to be 8 bytes, or two 32 bit ints");

    int32_t wBits = 0xFFFFFFFF & (measureResult >> 32);
    int32_t hBits = 0xFFFFFFFF & measureResult;

    const float* measuredWidth = reinterpret_cast<float*>(&wBits);
    const float* measuredHeight = reinterpret_cast<float*>(&hBits);

    return YGSize{*measuredWidth, *measuredHeight};
  } else {
    Log::log(
        node,
        YGLogLevelError,
        nullptr,
        "Java YGNode was GCed during layout calculation\n");
    return YGSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

static void jni_YGNodeSetHasMeasureFuncJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean hasMeasureFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setMeasureFunc(hasMeasureFunc ? YGJNIMeasureFunc : nullptr);
}

static float YGJNIBaselineFunc(
    YGNodeRef node,
    float width,
    float height,
    void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    JNIEnv* env = getCurrentEnv();
    auto objectClass = facebook::yoga::vanillajni::make_local_ref(
        env, env->GetObjectClass(obj.get()));
    static const jmethodID methodId = facebook::yoga::vanillajni::getMethodId(
        env, objectClass.get(), "baseline", "(FF)F");
    return facebook::yoga::vanillajni::callFloatMethod(
        env, obj.get(), methodId, width, height);
  } else {
    return height;
  }
}

static void jni_YGNodeSetHasBaselineFuncJNI(
    JNIEnv* env,
    jobject obj,
    jlong nativePointer,
    jboolean hasBaselineFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setBaselineFunc(hasBaselineFunc ? YGJNIBaselineFunc : nullptr);
}

static void jni_YGNodePrintJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
#ifdef DEBUG
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodePrint(
      node,
      (YGPrintOptions) (YGPrintOptionsStyle | YGPrintOptionsLayout | YGPrintOptionsChildren));
#endif
}

static jlong jni_YGNodeCloneJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
  auto node = _jlong2YGNodeRef(nativePointer);
  const YGNodeRef clonedYogaNode = YGNodeClone(node);
  clonedYogaNode->setContext(node->getContext());

  return reinterpret_cast<jlong>(clonedYogaNode);
}

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

static JNINativeMethod methods[] = {
    {"jni_YGConfigNewJNI", "()J", (void*) jni_YGConfigNewJNI},
    {"jni_YGConfigFreeJNI", "(J)V", (void*) jni_YGConfigFreeJNI},
    {"jni_YGConfigSetExperimentalFeatureEnabledJNI",
     "(JIZ)V",
     (void*) jni_YGConfigSetExperimentalFeatureEnabledJNI},
    {"jni_YGConfigSetUseWebDefaultsJNI",
     "(JZ)V",
     (void*) jni_YGConfigSetUseWebDefaultsJNI},
    {"jni_YGConfigSetPrintTreeFlagJNI",
     "(JZ)V",
     (void*) jni_YGConfigSetPrintTreeFlagJNI},
    {"jni_YGConfigSetPointScaleFactorJNI",
     "(JF)V",
     (void*) jni_YGConfigSetPointScaleFactorJNI},
    {"jni_YGConfigSetUseLegacyStretchBehaviourJNI",
     "(JZ)V",
     (void*) jni_YGConfigSetUseLegacyStretchBehaviourJNI},
    {"jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviourJNI",
     "(JZ)V",
     (void*) jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviourJNI},
    {"jni_YGConfigSetLoggerJNI",
     "(JLcom/facebook/yoga/YogaLogger;)V",
     (void*) jni_YGConfigSetLoggerJNI},
    {"jni_YGNodeNewJNI", "()J", (void*) jni_YGNodeNewJNI},
    {"jni_YGNodeNewWithConfigJNI", "(J)J", (void*) jni_YGNodeNewWithConfigJNI},
    {"jni_YGNodeFreeJNI", "(J)V", (void*) jni_YGNodeFreeJNI},
    {"jni_YGNodeResetJNI", "(J)V", (void*) jni_YGNodeResetJNI},
    {"jni_YGNodeInsertChildJNI", "(JJI)V", (void*) jni_YGNodeInsertChildJNI},
    {"jni_YGNodeSwapChildJNI", "(JJI)V", (void*) jni_YGNodeSwapChildJNI},
    {"jni_YGNodeSetIsReferenceBaselineJNI",
     "(JZ)V",
     (void*) jni_YGNodeSetIsReferenceBaselineJNI},
    {"jni_YGNodeIsReferenceBaselineJNI",
     "(J)Z",
     (void*) jni_YGNodeIsReferenceBaselineJNI},
    {"jni_YGNodeClearChildrenJNI", "(J)V", (void*) jni_YGNodeClearChildrenJNI},
    {"jni_YGNodeRemoveChildJNI", "(JJ)V", (void*) jni_YGNodeRemoveChildJNI},
    {"jni_YGNodeCalculateLayoutJNI",
     "(JFF[J[Lcom/facebook/yoga/YogaNodeJNIBase;)V",
     (void*) jni_YGNodeCalculateLayoutJNI},
    {"jni_YGNodeMarkDirtyJNI", "(J)V", (void*) jni_YGNodeMarkDirtyJNI},
    {"jni_YGNodeMarkDirtyAndPropogateToDescendantsJNI",
     "(J)V",
     (void*) jni_YGNodeMarkDirtyAndPropogateToDescendantsJNI},
    {"jni_YGNodeIsDirtyJNI", "(J)Z", (void*) jni_YGNodeIsDirtyJNI},
    {"jni_YGNodeCopyStyleJNI", "(JJ)V", (void*) jni_YGNodeCopyStyleJNI},
    {"jni_YGNodeStyleGetDirectionJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetDirectionJNI},
    {"jni_YGNodeStyleSetDirectionJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetDirectionJNI},
    {"jni_YGNodeStyleGetFlexDirectionJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetFlexDirectionJNI},
    {"jni_YGNodeStyleSetFlexDirectionJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetFlexDirectionJNI},
    {"jni_YGNodeStyleGetJustifyContentJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetJustifyContentJNI},
    {"jni_YGNodeStyleSetJustifyContentJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetJustifyContentJNI},
    {"jni_YGNodeStyleGetAlignItemsJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetAlignItemsJNI},
    {"jni_YGNodeStyleSetAlignItemsJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetAlignItemsJNI},
    {"jni_YGNodeStyleGetAlignSelfJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetAlignSelfJNI},
    {"jni_YGNodeStyleSetAlignSelfJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetAlignSelfJNI},
    {"jni_YGNodeStyleGetAlignContentJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetAlignContentJNI},
    {"jni_YGNodeStyleSetAlignContentJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetAlignContentJNI},
    {"jni_YGNodeStyleGetPositionTypeJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetPositionTypeJNI},
    {"jni_YGNodeStyleSetPositionTypeJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetPositionTypeJNI},
    {"jni_YGNodeStyleGetFlexWrapJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetFlexWrapJNI},
    {"jni_YGNodeStyleSetFlexWrapJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetFlexWrapJNI},
    {"jni_YGNodeStyleGetOverflowJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetOverflowJNI},
    {"jni_YGNodeStyleSetOverflowJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetOverflowJNI},
    {"jni_YGNodeStyleGetDisplayJNI",
     "(J)I",
     (void*) jni_YGNodeStyleGetDisplayJNI},
    {"jni_YGNodeStyleSetDisplayJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetDisplayJNI},
    {"jni_YGNodeStyleGetFlexJNI", "(J)F", (void*) jni_YGNodeStyleGetFlexJNI},
    {"jni_YGNodeStyleSetFlexJNI", "(JF)V", (void*) jni_YGNodeStyleSetFlexJNI},
    {"jni_YGNodeStyleGetFlexGrowJNI",
     "(J)F",
     (void*) jni_YGNodeStyleGetFlexGrowJNI},
    {"jni_YGNodeStyleSetFlexGrowJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetFlexGrowJNI},
    {"jni_YGNodeStyleGetFlexShrinkJNI",
     "(J)F",
     (void*) jni_YGNodeStyleGetFlexShrinkJNI},
    {"jni_YGNodeStyleSetFlexShrinkJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetFlexShrinkJNI},
    {"jni_YGNodeStyleGetFlexBasisJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetFlexBasisJNI},
    {"jni_YGNodeStyleSetFlexBasisJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetFlexBasisJNI},
    {"jni_YGNodeStyleSetFlexBasisPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetFlexBasisPercentJNI},
    {"jni_YGNodeStyleSetFlexBasisAutoJNI",
     "(J)V",
     (void*) jni_YGNodeStyleSetFlexBasisAutoJNI},
    {"jni_YGNodeStyleGetMarginJNI",
     "(JI)J",
     (void*) jni_YGNodeStyleGetMarginJNI},
    {"jni_YGNodeStyleSetMarginJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetMarginJNI},
    {"jni_YGNodeStyleSetMarginPercentJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetMarginPercentJNI},
    {"jni_YGNodeStyleSetMarginAutoJNI",
     "(JI)V",
     (void*) jni_YGNodeStyleSetMarginAutoJNI},
    {"jni_YGNodeStyleGetPaddingJNI",
     "(JI)J",
     (void*) jni_YGNodeStyleGetPaddingJNI},
    {"jni_YGNodeStyleSetPaddingJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetPaddingJNI},
    {"jni_YGNodeStyleSetPaddingPercentJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetPaddingPercentJNI},
    {"jni_YGNodeStyleGetBorderJNI",
     "(JI)F",
     (void*) jni_YGNodeStyleGetBorderJNI},
    {"jni_YGNodeStyleSetBorderJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetBorderJNI},
    {"jni_YGNodeStyleGetPositionJNI",
     "(JI)J",
     (void*) jni_YGNodeStyleGetPositionJNI},
    {"jni_YGNodeStyleSetPositionJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetPositionJNI},
    {"jni_YGNodeStyleSetPositionPercentJNI",
     "(JIF)V",
     (void*) jni_YGNodeStyleSetPositionPercentJNI},
    {"jni_YGNodeStyleGetWidthJNI", "(J)J", (void*) jni_YGNodeStyleGetWidthJNI},
    {"jni_YGNodeStyleSetWidthJNI", "(JF)V", (void*) jni_YGNodeStyleSetWidthJNI},
    {"jni_YGNodeStyleSetWidthPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetWidthPercentJNI},
    {"jni_YGNodeStyleSetWidthAutoJNI",
     "(J)V",
     (void*) jni_YGNodeStyleSetWidthAutoJNI},
    {"jni_YGNodeStyleGetHeightJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetHeightJNI},
    {"jni_YGNodeStyleSetHeightJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetHeightJNI},
    {"jni_YGNodeStyleSetHeightPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetHeightPercentJNI},
    {"jni_YGNodeStyleSetHeightAutoJNI",
     "(J)V",
     (void*) jni_YGNodeStyleSetHeightAutoJNI},
    {"jni_YGNodeStyleGetMinWidthJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetMinWidthJNI},
    {"jni_YGNodeStyleSetMinWidthJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMinWidthJNI},
    {"jni_YGNodeStyleSetMinWidthPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMinWidthPercentJNI},
    {"jni_YGNodeStyleGetMinHeightJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetMinHeightJNI},
    {"jni_YGNodeStyleSetMinHeightJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMinHeightJNI},
    {"jni_YGNodeStyleSetMinHeightPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMinHeightPercentJNI},
    {"jni_YGNodeStyleGetMaxWidthJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetMaxWidthJNI},
    {"jni_YGNodeStyleSetMaxWidthJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMaxWidthJNI},
    {"jni_YGNodeStyleSetMaxWidthPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMaxWidthPercentJNI},
    {"jni_YGNodeStyleGetMaxHeightJNI",
     "(J)J",
     (void*) jni_YGNodeStyleGetMaxHeightJNI},
    {"jni_YGNodeStyleSetMaxHeightJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMaxHeightJNI},
    {"jni_YGNodeStyleSetMaxHeightPercentJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetMaxHeightPercentJNI},
    {"jni_YGNodeStyleGetAspectRatioJNI",
     "(J)F",
     (void*) jni_YGNodeStyleGetAspectRatioJNI},
    {"jni_YGNodeStyleSetAspectRatioJNI",
     "(JF)V",
     (void*) jni_YGNodeStyleSetAspectRatioJNI},
    {"jni_YGNodeSetHasMeasureFuncJNI",
     "(JZ)V",
     (void*) jni_YGNodeSetHasMeasureFuncJNI},
    {"jni_YGNodeSetHasBaselineFuncJNI",
     "(JZ)V",
     (void*) jni_YGNodeSetHasBaselineFuncJNI},
    {"jni_YGNodePrintJNI", "(J)V", (void*) jni_YGNodePrintJNI},
    {"jni_YGNodeCloneJNI", "(J)J", (void*) jni_YGNodeCloneJNI},
};

void YGJNIVanilla::registerNatives(JNIEnv* env) {
  facebook::yoga::vanillajni::registerNatives(
      env,
      "com/facebook/yoga/YogaNative",
      methods,
      sizeof(methods) / sizeof(JNINativeMethod));
}
