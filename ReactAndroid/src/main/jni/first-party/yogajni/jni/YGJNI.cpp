/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <fb/fbjni.h>
#include <iostream>
#include <yoga/Yoga.h>

using namespace facebook::jni;
using namespace std;

static inline weak_ref<jobject> *YGNodeJobject(YGNodeRef node) {
  return reinterpret_cast<weak_ref<jobject> *>(YGNodeGetContext(node));
}

static void YGTransferLayoutDirection(YGNodeRef node, alias_ref<jobject> javaNode) {
  static auto layoutDirectionField = javaNode->getClass()->getField<jint>("mLayoutDirection");
  javaNode->setFieldValue(layoutDirectionField, static_cast<jint>(YGNodeLayoutGetDirection(node)));
}

static void YGTransferLayoutOutputsRecursive(YGNodeRef root) {
  if (auto obj = YGNodeJobject(root)->lockLocal()) {
    static auto widthField = obj->getClass()->getField<jfloat>("mWidth");
    static auto heightField = obj->getClass()->getField<jfloat>("mHeight");
    static auto leftField = obj->getClass()->getField<jfloat>("mLeft");
    static auto topField = obj->getClass()->getField<jfloat>("mTop");

    obj->setFieldValue(widthField, YGNodeLayoutGetWidth(root));
    obj->setFieldValue(heightField, YGNodeLayoutGetHeight(root));
    obj->setFieldValue(leftField, YGNodeLayoutGetLeft(root));
    obj->setFieldValue(topField, YGNodeLayoutGetTop(root));
    YGTransferLayoutDirection(root, obj);

    for (uint32_t i = 0; i < YGNodeGetChildCount(root); i++) {
      YGTransferLayoutOutputsRecursive(YGNodeGetChild(root, i));
    }
  } else {
    YGLog(YGLogLevelError, "Java YGNode was GCed during layout calculation\n");
  }
}

static void YGPrint(YGNodeRef node) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    cout << obj->toString() << endl;
  } else {
    YGLog(YGLogLevelError, "Java YGNode was GCed during layout calculation\n");
  }
}

static YGSize YGJNIMeasureFunc(YGNodeRef node,
                               float width,
                               YGMeasureMode widthMode,
                               float height,
                               YGMeasureMode heightMode) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    static auto measureFunc = findClassLocal("com/facebook/yoga/YogaNode")
                                  ->getMethod<jlong(jfloat, jint, jfloat, jint)>("measure");

    YGTransferLayoutDirection(node, obj);
    const auto measureResult = measureFunc(obj, width, widthMode, height, heightMode);

    static_assert(sizeof(measureResult) == 8,
                  "Expected measureResult to be 8 bytes, or two 32 bit ints");

    int32_t wBits = 0xFFFFFFFF & (measureResult >> 32);
    int32_t hBits = 0xFFFFFFFF & measureResult;

    const float *measuredWidth = reinterpret_cast<float *>(&wBits);
    const float *measuredHeight = reinterpret_cast<float *>(&hBits);

    return YGSize{*measuredWidth, *measuredHeight};
  } else {
    YGLog(YGLogLevelError, "Java YGNode was GCed during layout calculation\n");
    return YGSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

struct JYogaLogLevel : public JavaClass<JYogaLogLevel> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogLevel;";
};

static global_ref<jobject> *jLogger;
static int YGLog(YGLogLevel level, const char *format, va_list args) {
  char buffer[256];
  int result = vsnprintf(buffer, sizeof(buffer), format, args);

  static auto logFunc = findClassLocal("com/facebook/yoga/YogaLogger")
                            ->getMethod<void(local_ref<JYogaLogLevel>, jstring)>("log");

  static auto logLevelFromInt =
      JYogaLogLevel::javaClassStatic()->getStaticMethod<JYogaLogLevel::javaobject(jint)>("fromInt");

  logFunc(jLogger->get(),
          logLevelFromInt(JYogaLogLevel::javaClassStatic(), static_cast<jint>(level)),
          Environment::current()->NewStringUTF(buffer));

  return result;
}

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
}

void jni_YGSetLogger(alias_ref<jclass> clazz, alias_ref<jobject> logger) {
  if (jLogger) {
    jLogger->releaseAlias();
    delete jLogger;
  }

  if (logger) {
    jLogger = new global_ref<jobject>(make_global(logger));
    YGSetLogger(YGLog);
  } else {
    jLogger = NULL;
    YGSetLogger(NULL);
  }
}

void jni_YGLog(alias_ref<jclass> clazz, jint level, jstring message) {
  const char *nMessage = Environment::current()->GetStringUTFChars(message, 0);
  YGLog(static_cast<YGLogLevel>(level), "%s", nMessage);
  Environment::current()->ReleaseStringUTFChars(message, nMessage);
}

void jni_YGSetExperimentalFeatureEnabled(alias_ref<jclass> clazz, jint feature, jboolean enabled) {
  YGSetExperimentalFeatureEnabled(static_cast<YGExperimentalFeature>(feature), enabled);
}

jboolean jni_YGIsExperimentalFeatureEnabled(alias_ref<jclass> clazz, jint feature) {
  return YGIsExperimentalFeatureEnabled(static_cast<YGExperimentalFeature>(feature));
}

jint jni_YGNodeGetInstanceCount(alias_ref<jclass> clazz) {
  return YGNodeGetInstanceCount();
}

jlong jni_YGNodeNew(alias_ref<jobject> thiz) {
  const YGNodeRef node = YGNodeNew();
  YGNodeSetContext(node, new weak_ref<jobject>(make_weak(thiz)));
  YGNodeSetPrintFunc(node, YGPrint);
  return reinterpret_cast<jlong>(node);
}

void jni_YGNodeFree(alias_ref<jobject> thiz, jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  delete YGNodeJobject(node);
  YGNodeFree(node);
}

void jni_YGNodeReset(alias_ref<jobject> thiz, jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  void *context = YGNodeGetContext(node);
  YGNodeReset(node);
  YGNodeSetContext(node, context);
  YGNodeSetPrintFunc(node, YGPrint);
}

void jni_YGNodeInsertChild(alias_ref<jobject>, jlong nativePointer, jlong childPointer, jint index) {
  YGNodeInsertChild(_jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer), index);
}

void jni_YGNodeRemoveChild(alias_ref<jobject>, jlong nativePointer, jlong childPointer) {
  YGNodeRemoveChild(_jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer));
}

void jni_YGNodeCalculateLayout(alias_ref<jobject>, jlong nativePointer) {
  const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
  YGNodeCalculateLayout(root,
                        YGUndefined,
                        YGUndefined,
                        YGNodeStyleGetDirection(_jlong2YGNodeRef(nativePointer)));
  YGTransferLayoutOutputsRecursive(root);
}

void jni_YGNodeMarkDirty(alias_ref<jobject>, jlong nativePointer) {
  YGNodeMarkDirty(_jlong2YGNodeRef(nativePointer));
}

jboolean jni_YGNodeIsDirty(alias_ref<jobject>, jlong nativePointer) {
  return (jboolean) YGNodeIsDirty(_jlong2YGNodeRef(nativePointer));
}

void jni_YGNodeSetHasMeasureFunc(alias_ref<jobject>, jlong nativePointer, jboolean hasMeasureFunc) {
  YGNodeSetMeasureFunc(_jlong2YGNodeRef(nativePointer), hasMeasureFunc ? YGJNIMeasureFunc : NULL);
}

jboolean jni_YGNodeHasNewLayout(alias_ref<jobject>, jlong nativePointer) {
  return (jboolean) YGNodeGetHasNewLayout(_jlong2YGNodeRef(nativePointer));
}

void jni_YGNodeMarkLayoutSeen(alias_ref<jobject>, jlong nativePointer) {
  YGNodeSetHasNewLayout(_jlong2YGNodeRef(nativePointer), false);
}

void jni_YGNodeCopyStyle(alias_ref<jobject>, jlong dstNativePointer, jlong srcNativePointer) {
  YGNodeCopyStyle(_jlong2YGNodeRef(dstNativePointer), _jlong2YGNodeRef(srcNativePointer));
}

struct JYogaValue : public JavaClass<JYogaValue> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/yoga/YogaValue;";

  static local_ref<javaobject> create(YGValue value) {
    return newInstance(value.value, static_cast<int>(value.unit));
  }
};

#define YG_NODE_JNI_STYLE_PROP(javatype, type, name)                                       \
  javatype jni_YGNodeStyleGet##name(alias_ref<jobject>, jlong nativePointer) {             \
    return (javatype) YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer));               \
  }                                                                                        \
                                                                                           \
  void jni_YGNodeStyleSet##name(alias_ref<jobject>, jlong nativePointer, javatype value) { \
    YGNodeStyleSet##name(_jlong2YGNodeRef(nativePointer), static_cast<type>(value));       \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP(name)                                                         \
  local_ref<jobject> jni_YGNodeStyleGet##name(alias_ref<jobject>, jlong nativePointer) {          \
    return JYogaValue::create(YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)));             \
  }                                                                                               \
                                                                                                  \
  void jni_YGNodeStyleSet##name(alias_ref<jobject>, jlong nativePointer, jfloat value) {          \
    YGNodeStyleSet##name(_jlong2YGNodeRef(nativePointer), static_cast<float>(value));             \
  }                                                                                               \
                                                                                                  \
  void jni_YGNodeStyleSet##name##Percent(alias_ref<jobject>, jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name##Percent(_jlong2YGNodeRef(nativePointer), static_cast<float>(value));    \
  }

#define YG_NODE_JNI_STYLE_EDGE_PROP(javatype, type, name)                                 \
  javatype jni_YGNodeStyleGet##name(alias_ref<jobject>, jlong nativePointer, jint edge) { \
    return (javatype) YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer),               \
                                           static_cast<YGEdge>(edge));                    \
  }                                                                                       \
                                                                                          \
  void jni_YGNodeStyleSet##name(alias_ref<jobject>,                                       \
                                jlong nativePointer,                                      \
                                jint edge,                                                \
                                javatype value) {                                         \
    YGNodeStyleSet##name(_jlong2YGNodeRef(nativePointer),                                 \
                         static_cast<YGEdge>(edge),                                       \
                         static_cast<type>(value));                                       \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                                                      \
  local_ref<jobject> jni_YGNodeStyleGet##name(alias_ref<jobject>,                                   \
                                              jlong nativePointer,                                  \
                                              jint edge) {                                          \
    return JYogaValue::create(                                                                      \
        YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge)));          \
  }                                                                                                 \
                                                                                                    \
  void jni_YGNodeStyleSet##name(alias_ref<jobject>, jlong nativePointer, jint edge, jfloat value) { \
    YGNodeStyleSet##name(_jlong2YGNodeRef(nativePointer),                                           \
                         static_cast<YGEdge>(edge),                                                 \
                         static_cast<float>(value));                                                \
  }                                                                                                 \
                                                                                                    \
  void jni_YGNodeStyleSet##name##Percent(alias_ref<jobject>,                                        \
                                         jlong nativePointer,                                       \
                                         jint edge,                                                 \
                                         jfloat value) {                                            \
    YGNodeStyleSet##name##Percent(_jlong2YGNodeRef(nativePointer),                                  \
                                  static_cast<YGEdge>(edge),                                        \
                                  static_cast<float>(value));                                       \
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

void jni_YGNodeStyleSetFlex(alias_ref<jobject>, jlong nativePointer, jfloat value) {
  YGNodeStyleSetFlex(_jlong2YGNodeRef(nativePointer), static_cast<float>(value));
}
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);
YG_NODE_JNI_STYLE_UNIT_PROP(FlexBasis);

YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Position);
YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Margin);
YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Padding);
YG_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Border);

YG_NODE_JNI_STYLE_UNIT_PROP(Width);
YG_NODE_JNI_STYLE_UNIT_PROP(MinWidth);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxWidth);
YG_NODE_JNI_STYLE_UNIT_PROP(Height);
YG_NODE_JNI_STYLE_UNIT_PROP(MinHeight);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxHeight);

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

#define YGMakeNativeMethod(name) makeNativeMethod(#name, name)

jint JNI_OnLoad(JavaVM *vm, void *) {
  return initialize(vm, [] {
    registerNatives("com/facebook/yoga/YogaNode",
                    {
                        YGMakeNativeMethod(jni_YGNodeNew),
                        YGMakeNativeMethod(jni_YGNodeFree),
                        YGMakeNativeMethod(jni_YGNodeReset),
                        YGMakeNativeMethod(jni_YGNodeInsertChild),
                        YGMakeNativeMethod(jni_YGNodeRemoveChild),
                        YGMakeNativeMethod(jni_YGNodeCalculateLayout),
                        YGMakeNativeMethod(jni_YGNodeHasNewLayout),
                        YGMakeNativeMethod(jni_YGNodeMarkDirty),
                        YGMakeNativeMethod(jni_YGNodeIsDirty),
                        YGMakeNativeMethod(jni_YGNodeMarkLayoutSeen),
                        YGMakeNativeMethod(jni_YGNodeSetHasMeasureFunc),
                        YGMakeNativeMethod(jni_YGNodeCopyStyle),
                        YGMakeNativeMethod(jni_YGNodeStyleGetDirection),
                        YGMakeNativeMethod(jni_YGNodeStyleSetDirection),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexDirection),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexDirection),
                        YGMakeNativeMethod(jni_YGNodeStyleGetJustifyContent),
                        YGMakeNativeMethod(jni_YGNodeStyleSetJustifyContent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetAlignItems),
                        YGMakeNativeMethod(jni_YGNodeStyleSetAlignItems),
                        YGMakeNativeMethod(jni_YGNodeStyleGetAlignSelf),
                        YGMakeNativeMethod(jni_YGNodeStyleSetAlignSelf),
                        YGMakeNativeMethod(jni_YGNodeStyleGetAlignContent),
                        YGMakeNativeMethod(jni_YGNodeStyleSetAlignContent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetPositionType),
                        YGMakeNativeMethod(jni_YGNodeStyleSetPositionType),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexWrap),
                        YGMakeNativeMethod(jni_YGNodeStyleGetOverflow),
                        YGMakeNativeMethod(jni_YGNodeStyleSetOverflow),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlex),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexGrow),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexGrow),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexShrink),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexShrink),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexBasis),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexBasis),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexBasisPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMargin),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMargin),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMarginPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetPadding),
                        YGMakeNativeMethod(jni_YGNodeStyleSetPadding),
                        YGMakeNativeMethod(jni_YGNodeStyleSetPaddingPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetBorder),
                        YGMakeNativeMethod(jni_YGNodeStyleSetBorder),
                        YGMakeNativeMethod(jni_YGNodeStyleGetPosition),
                        YGMakeNativeMethod(jni_YGNodeStyleSetPosition),
                        YGMakeNativeMethod(jni_YGNodeStyleSetPositionPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetWidthPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetHeightPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMinWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMinWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMinWidthPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMinHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMinHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMinHeightPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMaxWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMaxWidth),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMaxWidthPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMaxHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMaxHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMaxHeightPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleGetAspectRatio),
                        YGMakeNativeMethod(jni_YGNodeStyleSetAspectRatio),
                        YGMakeNativeMethod(jni_YGNodeGetInstanceCount),
                        YGMakeNativeMethod(jni_YGSetLogger),
                        YGMakeNativeMethod(jni_YGLog),
                        YGMakeNativeMethod(jni_YGSetExperimentalFeatureEnabled),
                        YGMakeNativeMethod(jni_YGIsExperimentalFeatureEnabled),
                    });
  });
}
