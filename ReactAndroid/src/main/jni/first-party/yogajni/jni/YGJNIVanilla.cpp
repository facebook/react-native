/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "jni.h"
#include "YGJNIVanilla.h"
#include <yoga/YGNode.h>
#include <cstring>
#include "YGJNI.h"

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
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

static void jni_YGNodePrintJNI(JNIEnv* env, jobject obj, jlong nativePointer) {
#ifdef DEBUG
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodePrint(
      node,
      (YGPrintOptions)(
          YGPrintOptionsStyle | YGPrintOptionsLayout | YGPrintOptionsChildren));
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

void assertNoPendingJniException(JNIEnv* env) {
  // This method cannot call any other method of the library, since other
  // methods of the library use it to check for exceptions too
  if (env->ExceptionCheck()) {
    env->ExceptionDescribe();
  }
}

void registerNativeMethods(
    JNIEnv* env,
    const char* className,
    JNINativeMethod methods[],
    size_t numMethods) {
  jclass clazz = env->FindClass(className);

  assertNoPendingJniException(env);

  env->RegisterNatives(clazz, methods, numMethods);

  assertNoPendingJniException(env);
}

static JNINativeMethod methods[] = {
    {"jni_YGNodeFreeJNI", "(J)V", (void*) jni_YGNodeFreeJNI},
    {"jni_YGNodeResetJNI", "(J)V", (void*) jni_YGNodeResetJNI},
    {"jni_YGNodeInsertChildJNI", "(JJI)V", (void*) jni_YGNodeInsertChildJNI},
    {"jni_YGNodeSetIsReferenceBaselineJNI",
     "(JZ)V",
     (void*) jni_YGNodeSetIsReferenceBaselineJNI},
    {"jni_YGNodeIsReferenceBaselineJNI",
     "(J)Z",
     (void*) jni_YGNodeIsReferenceBaselineJNI},
    {"jni_YGNodeClearChildrenJNI", "(J)V", (void*) jni_YGNodeClearChildrenJNI},
    {"jni_YGNodeRemoveChildJNI", "(JJ)V", (void*) jni_YGNodeRemoveChildJNI},
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
    {"jni_YGNodePrintJNI", "(J)V", (void*) jni_YGNodePrintJNI},
    {"jni_YGNodeCloneJNI", "(J)J", (void*) jni_YGNodeCloneJNI},
};

void YGJNIVanilla::registerNatives(JNIEnv* env) {
  registerNativeMethods(
      env,
      "com/facebook/yoga/YogaNative",
      methods,
      sizeof(methods) / sizeof(JNINativeMethod));
}
