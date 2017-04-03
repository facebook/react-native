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
  if(YGNodeGetHasNewLayout(root)){
    if (auto obj = YGNodeJobject(root)->lockLocal()) {
      static auto widthField = obj->getClass()->getField<jfloat>("mWidth");
      static auto heightField = obj->getClass()->getField<jfloat>("mHeight");
      static auto leftField = obj->getClass()->getField<jfloat>("mLeft");
      static auto topField = obj->getClass()->getField<jfloat>("mTop");

      static auto marginLeftField = obj->getClass()->getField<jfloat>("mMarginLeft");
      static auto marginTopField = obj->getClass()->getField<jfloat>("mMarginTop");
      static auto marginRightField = obj->getClass()->getField<jfloat>("mMarginRight");
      static auto marginBottomField = obj->getClass()->getField<jfloat>("mMarginBottom");

      static auto paddingLeftField = obj->getClass()->getField<jfloat>("mPaddingLeft");
      static auto paddingTopField = obj->getClass()->getField<jfloat>("mPaddingTop");
      static auto paddingRightField = obj->getClass()->getField<jfloat>("mPaddingRight");
      static auto paddingBottomField = obj->getClass()->getField<jfloat>("mPaddingBottom");

      static auto borderLeftField = obj->getClass()->getField<jfloat>("mBorderLeft");
      static auto borderTopField = obj->getClass()->getField<jfloat>("mBorderTop");
      static auto borderRightField = obj->getClass()->getField<jfloat>("mBorderRight");
      static auto borderBottomField = obj->getClass()->getField<jfloat>("mBorderBottom");

      static auto edgeSetFlagField = obj->getClass()->getField<jint>("mEdgeSetFlag");
      static auto hasNewLayoutField = obj->getClass()->getField<jboolean>("mHasNewLayout");

      /* Those flags needs be in sync with YogaNode.java */
      const int MARGIN = 1;
      const int PADDING = 2;
      const int BORDER = 4;

      int hasEdgeSetFlag = (int)obj->getFieldValue(edgeSetFlagField);

      obj->setFieldValue(widthField, YGNodeLayoutGetWidth(root));
      obj->setFieldValue(heightField, YGNodeLayoutGetHeight(root));
      obj->setFieldValue(leftField, YGNodeLayoutGetLeft(root));
      obj->setFieldValue(topField, YGNodeLayoutGetTop(root));

      if((hasEdgeSetFlag & MARGIN) == MARGIN){
        obj->setFieldValue(marginLeftField, YGNodeLayoutGetMargin(root, YGEdgeLeft));
        obj->setFieldValue(marginTopField, YGNodeLayoutGetMargin(root, YGEdgeTop));
        obj->setFieldValue(marginRightField, YGNodeLayoutGetMargin(root, YGEdgeRight));
        obj->setFieldValue(marginBottomField, YGNodeLayoutGetMargin(root, YGEdgeBottom));
      }

      if((hasEdgeSetFlag & PADDING) == PADDING){
        obj->setFieldValue(paddingLeftField, YGNodeLayoutGetPadding(root, YGEdgeLeft));
        obj->setFieldValue(paddingTopField, YGNodeLayoutGetPadding(root, YGEdgeTop));
        obj->setFieldValue(paddingRightField, YGNodeLayoutGetPadding(root, YGEdgeRight));
        obj->setFieldValue(paddingBottomField, YGNodeLayoutGetPadding(root, YGEdgeBottom));
      }

      if((hasEdgeSetFlag & BORDER) == BORDER){
        obj->setFieldValue(borderLeftField, YGNodeLayoutGetBorder(root, YGEdgeLeft));
        obj->setFieldValue(borderTopField, YGNodeLayoutGetBorder(root, YGEdgeTop));
        obj->setFieldValue(borderRightField, YGNodeLayoutGetBorder(root, YGEdgeRight));
        obj->setFieldValue(borderBottomField, YGNodeLayoutGetBorder(root, YGEdgeBottom));
      }

      obj->setFieldValue<jboolean>(hasNewLayoutField, true);
      YGTransferLayoutDirection(root, obj);
      YGNodeSetHasNewLayout(root, false);

      for (uint32_t i = 0; i < YGNodeGetChildCount(root); i++) {
        YGTransferLayoutOutputsRecursive(YGNodeGetChild(root, i));
      }
    } else {
      YGLog(YGLogLevelError, "Java YGNode was GCed during layout calculation\n");
    }
  }
}

static void YGPrint(YGNodeRef node) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    cout << obj->toString() << endl;
  } else {
    YGLog(YGLogLevelError, "Java YGNode was GCed during layout calculation\n");
  }
}

static float YGJNIBaselineFunc(YGNodeRef node, float width, float height) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    static auto baselineFunc = findClassStatic("com/facebook/yoga/YogaNode")
                                   ->getMethod<jfloat(jfloat, jfloat)>("baseline");
    return baselineFunc(obj, width, height);
  } else {
    return height;
  }
}

static YGSize YGJNIMeasureFunc(YGNodeRef node,
                               float width,
                               YGMeasureMode widthMode,
                               float height,
                               YGMeasureMode heightMode) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    static auto measureFunc = findClassStatic("com/facebook/yoga/YogaNode")
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

  static auto logFunc = findClassStatic("com/facebook/yoga/YogaLogger")
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

static inline YGConfigRef _jlong2YGConfigRef(jlong addr) {
  return reinterpret_cast<YGConfigRef>(static_cast<intptr_t>(addr));
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

jlong jni_YGNodeNew(alias_ref<jobject> thiz) {
  const YGNodeRef node = YGNodeNew();
  YGNodeSetContext(node, new weak_ref<jobject>(make_weak(thiz)));
  YGNodeSetPrintFunc(node, YGPrint);
  return reinterpret_cast<jlong>(node);
}

jlong jni_YGNodeNewWithConfig(alias_ref<jobject> thiz, jlong configPointer) {
  const YGNodeRef node = YGNodeNewWithConfig(_jlong2YGConfigRef(configPointer));
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

void jni_YGNodeCalculateLayout(alias_ref<jobject>,
                               jlong nativePointer,
                               jfloat width,
                               jfloat height) {
  const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
  YGNodeCalculateLayout(root,
                        static_cast<float>(width),
                        static_cast<float>(height),
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

void jni_YGNodeSetHasBaselineFunc(alias_ref<jobject>,
                                  jlong nativePointer,
                                  jboolean hasBaselineFunc) {
  YGNodeSetBaselineFunc(_jlong2YGNodeRef(nativePointer),
                        hasBaselineFunc ? YGJNIBaselineFunc : NULL);
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

#define YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(name)                                   \
  YG_NODE_JNI_STYLE_UNIT_PROP(name)                                              \
  void jni_YGNodeStyleSet##name##Auto(alias_ref<jobject>, jlong nativePointer) { \
    YGNodeStyleSet##name##Auto(_jlong2YGNodeRef(nativePointer));                 \
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

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP_AUTO(name)                                         \
  YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                                                    \
  void jni_YGNodeStyleSet##name##Auto(alias_ref<jobject>, jlong nativePointer, jint edge) { \
    YGNodeStyleSet##name##Auto(_jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge)); \
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

void jni_YGNodeStyleSetFlex(alias_ref<jobject>, jlong nativePointer, jfloat value) {
  YGNodeStyleSetFlex(_jlong2YGNodeRef(nativePointer), static_cast<float>(value));
}
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(FlexBasis);

YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Position);
YG_NODE_JNI_STYLE_EDGE_UNIT_PROP_AUTO(Margin);
YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Padding);
YG_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Border);

YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Width);
YG_NODE_JNI_STYLE_UNIT_PROP(MinWidth);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxWidth);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Height);
YG_NODE_JNI_STYLE_UNIT_PROP(MinHeight);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxHeight);

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

jlong jni_YGConfigNew(alias_ref<jobject>) {
  return reinterpret_cast<jlong>(YGConfigNew());
}

void jni_YGConfigFree(alias_ref<jobject>, jlong nativePointer) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigFree(config);
}

void jni_YGConfigSetExperimentalFeatureEnabled(alias_ref<jobject>, jlong nativePointer, jint feature, jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetExperimentalFeatureEnabled(config, static_cast<YGExperimentalFeature>(feature), enabled);
}

void jni_YGConfigSetUseWebDefaults(alias_ref<jobject>, jlong nativePointer, jboolean useWebDefaults) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseWebDefaults(config, useWebDefaults);
}

jint jni_YGNodeGetInstanceCount(alias_ref<jclass> clazz) {
  return YGNodeGetInstanceCount();
}

#define YGMakeNativeMethod(name) makeNativeMethod(#name, name)

jint JNI_OnLoad(JavaVM *vm, void *) {
  return initialize(vm, [] {
    registerNatives("com/facebook/yoga/YogaNode",
                    {
                        YGMakeNativeMethod(jni_YGNodeNew),
                        YGMakeNativeMethod(jni_YGNodeNewWithConfig),
                        YGMakeNativeMethod(jni_YGNodeFree),
                        YGMakeNativeMethod(jni_YGNodeReset),
                        YGMakeNativeMethod(jni_YGNodeInsertChild),
                        YGMakeNativeMethod(jni_YGNodeRemoveChild),
                        YGMakeNativeMethod(jni_YGNodeCalculateLayout),
                        YGMakeNativeMethod(jni_YGNodeMarkDirty),
                        YGMakeNativeMethod(jni_YGNodeIsDirty),
                        YGMakeNativeMethod(jni_YGNodeSetHasMeasureFunc),
                        YGMakeNativeMethod(jni_YGNodeSetHasBaselineFunc),
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
                        YGMakeNativeMethod(jni_YGNodeStyleGetDisplay),
                        YGMakeNativeMethod(jni_YGNodeStyleSetDisplay),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlex),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexGrow),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexGrow),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexShrink),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexShrink),
                        YGMakeNativeMethod(jni_YGNodeStyleGetFlexBasis),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexBasis),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexBasisPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleSetFlexBasisAuto),
                        YGMakeNativeMethod(jni_YGNodeStyleGetMargin),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMargin),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMarginPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleSetMarginAuto),
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
                        YGMakeNativeMethod(jni_YGNodeStyleSetWidthAuto),
                        YGMakeNativeMethod(jni_YGNodeStyleGetHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetHeight),
                        YGMakeNativeMethod(jni_YGNodeStyleSetHeightPercent),
                        YGMakeNativeMethod(jni_YGNodeStyleSetHeightAuto),
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
                    });
    registerNatives("com/facebook/yoga/YogaConfig",
                    {
                        YGMakeNativeMethod(jni_YGConfigNew),
                        YGMakeNativeMethod(jni_YGConfigFree),
                        YGMakeNativeMethod(jni_YGConfigSetExperimentalFeatureEnabled),
                        YGMakeNativeMethod(jni_YGConfigSetUseWebDefaults),
                    });
  });
}
