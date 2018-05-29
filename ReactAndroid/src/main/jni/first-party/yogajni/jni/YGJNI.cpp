/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include <fb/fbjni.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>
#include <iostream>

using namespace facebook::jni;
using namespace std;

struct JYogaNode : public JavaClass<JYogaNode> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaNode;";
};

struct JYogaConfig : public JavaClass<JYogaConfig> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaConfig;";
};

struct YGConfigContext {
  global_ref<jobject>* logger;
  global_ref<jobject>* config;
  YGConfigContext() : logger(nullptr), config(nullptr) {}
  ~YGConfigContext() {
    delete config;
    config = nullptr;
    delete logger;
    logger = nullptr;
  }
};

static inline weak_ref<JYogaNode>* YGNodeJobject(YGNodeRef node) {
  return reinterpret_cast<weak_ref<JYogaNode>*>(node->getContext());
}

static void YGTransferLayoutDirection(
    YGNodeRef node,
    alias_ref<jobject> javaNode) {
  static auto layoutDirectionField =
      javaNode->getClass()->getField<jint>("mLayoutDirection");
  javaNode->setFieldValue(
      layoutDirectionField, static_cast<jint>(YGNodeLayoutGetDirection(node)));
}

static void YGTransferLayoutOutputsRecursive(YGNodeRef root) {
  if (!root->getHasNewLayout()) {
    return;
  }
  auto obj = YGNodeJobject(root)->lockLocal();
  if (!obj) {
    YGLog(
        root,
        YGLogLevelError,
        "Java YGNode was GCed during layout calculation\n");
    return;
  }

  static auto widthField = obj->getClass()->getField<jfloat>("mWidth");
  static auto heightField = obj->getClass()->getField<jfloat>("mHeight");
  static auto leftField = obj->getClass()->getField<jfloat>("mLeft");
  static auto topField = obj->getClass()->getField<jfloat>("mTop");

  static auto marginLeftField =
      obj->getClass()->getField<jfloat>("mMarginLeft");
  static auto marginTopField = obj->getClass()->getField<jfloat>("mMarginTop");
  static auto marginRightField =
      obj->getClass()->getField<jfloat>("mMarginRight");
  static auto marginBottomField =
      obj->getClass()->getField<jfloat>("mMarginBottom");

  static auto paddingLeftField =
      obj->getClass()->getField<jfloat>("mPaddingLeft");
  static auto paddingTopField =
      obj->getClass()->getField<jfloat>("mPaddingTop");
  static auto paddingRightField =
      obj->getClass()->getField<jfloat>("mPaddingRight");
  static auto paddingBottomField =
      obj->getClass()->getField<jfloat>("mPaddingBottom");

  static auto borderLeftField =
      obj->getClass()->getField<jfloat>("mBorderLeft");
  static auto borderTopField = obj->getClass()->getField<jfloat>("mBorderTop");
  static auto borderRightField =
      obj->getClass()->getField<jfloat>("mBorderRight");
  static auto borderBottomField =
      obj->getClass()->getField<jfloat>("mBorderBottom");

  static auto edgeSetFlagField =
      obj->getClass()->getField<jint>("mEdgeSetFlag");
  static auto hasNewLayoutField =
      obj->getClass()->getField<jboolean>("mHasNewLayout");
  static auto doesLegacyStretchBehaviour = obj->getClass()->getField<jboolean>(
      "mDoesLegacyStretchFlagAffectsLayout");

  /* Those flags needs be in sync with YogaNode.java */
  const int MARGIN = 1;
  const int PADDING = 2;
  const int BORDER = 4;

  int hasEdgeSetFlag = (int)obj->getFieldValue(edgeSetFlagField);

  obj->setFieldValue(widthField, YGNodeLayoutGetWidth(root));
  obj->setFieldValue(heightField, YGNodeLayoutGetHeight(root));
  obj->setFieldValue(leftField, YGNodeLayoutGetLeft(root));
  obj->setFieldValue(topField, YGNodeLayoutGetTop(root));
  obj->setFieldValue<jboolean>(
      doesLegacyStretchBehaviour,
      YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(root));

  if ((hasEdgeSetFlag & MARGIN) == MARGIN) {
    obj->setFieldValue(
        marginLeftField, YGNodeLayoutGetMargin(root, YGEdgeLeft));
    obj->setFieldValue(marginTopField, YGNodeLayoutGetMargin(root, YGEdgeTop));
    obj->setFieldValue(
        marginRightField, YGNodeLayoutGetMargin(root, YGEdgeRight));
    obj->setFieldValue(
        marginBottomField, YGNodeLayoutGetMargin(root, YGEdgeBottom));
  }

  if ((hasEdgeSetFlag & PADDING) == PADDING) {
    obj->setFieldValue(
        paddingLeftField, YGNodeLayoutGetPadding(root, YGEdgeLeft));
    obj->setFieldValue(
        paddingTopField, YGNodeLayoutGetPadding(root, YGEdgeTop));
    obj->setFieldValue(
        paddingRightField, YGNodeLayoutGetPadding(root, YGEdgeRight));
    obj->setFieldValue(
        paddingBottomField, YGNodeLayoutGetPadding(root, YGEdgeBottom));
  }

  if ((hasEdgeSetFlag & BORDER) == BORDER) {
    obj->setFieldValue(
        borderLeftField, YGNodeLayoutGetBorder(root, YGEdgeLeft));
    obj->setFieldValue(borderTopField, YGNodeLayoutGetBorder(root, YGEdgeTop));
    obj->setFieldValue(
        borderRightField, YGNodeLayoutGetBorder(root, YGEdgeRight));
    obj->setFieldValue(
        borderBottomField, YGNodeLayoutGetBorder(root, YGEdgeBottom));
  }

  obj->setFieldValue<jboolean>(hasNewLayoutField, true);
  YGTransferLayoutDirection(root, obj);
  root->setHasNewLayout(false);

  for (uint32_t i = 0; i < YGNodeGetChildCount(root); i++) {
    YGTransferLayoutOutputsRecursive(YGNodeGetChild(root, i));
  }
}

static void YGPrint(YGNodeRef node) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    cout << obj->toString() << endl;
  } else {
    YGLog(
        node,
        YGLogLevelError,
        "Java YGNode was GCed during layout calculation\n");
  }
}

static float YGJNIBaselineFunc(YGNodeRef node, float width, float height) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    static auto baselineFunc =
        findClassStatic("com/facebook/yoga/YogaNode")
            ->getMethod<jfloat(jfloat, jfloat)>("baseline");
    return baselineFunc(obj, width, height);
  } else {
    return height;
  }
}

static inline YGNodeRef _jlong2YGNodeRef(jlong addr) {
  return reinterpret_cast<YGNodeRef>(static_cast<intptr_t>(addr));
}

static inline YGConfigRef _jlong2YGConfigRef(jlong addr) {
  return reinterpret_cast<YGConfigRef>(static_cast<intptr_t>(addr));
}

static YGNodeRef
YGJNIOnNodeClonedFunc(YGNodeRef oldNode, YGNodeRef owner, int childIndex) {
  auto config = oldNode->getConfig();
  if (!config) {
    return nullptr;
  }

  static auto onNodeClonedFunc =
      findClassStatic("com/facebook/yoga/YogaConfig")
          ->getMethod<alias_ref<JYogaNode>(
              local_ref<JYogaNode>, local_ref<JYogaNode>, jint)>("cloneNode");

  auto context = reinterpret_cast<YGConfigContext*>(YGConfigGetContext(config));
  auto javaConfig = context->config;

  auto newNode = onNodeClonedFunc(
      javaConfig->get(),
      YGNodeJobject(oldNode)->lockLocal(),
      YGNodeJobject(owner)->lockLocal(),
      childIndex);

  static auto replaceChild =
      findClassStatic("com/facebook/yoga/YogaNode")
          ->getMethod<jlong(local_ref<JYogaNode>, jint)>("replaceChild");

  jlong newNodeNativePointer =
      replaceChild(YGNodeJobject(owner)->lockLocal(), newNode, childIndex);

  return _jlong2YGNodeRef(newNodeNativePointer);
}

static YGSize YGJNIMeasureFunc(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode) {
  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    static auto measureFunc =
        findClassStatic("com/facebook/yoga/YogaNode")
            ->getMethod<jlong(jfloat, jint, jfloat, jint)>("measure");

    YGTransferLayoutDirection(node, obj);
    const auto measureResult =
        measureFunc(obj, width, widthMode, height, heightMode);

    static_assert(
        sizeof(measureResult) == 8,
        "Expected measureResult to be 8 bytes, or two 32 bit ints");

    int32_t wBits = 0xFFFFFFFF & (measureResult >> 32);
    int32_t hBits = 0xFFFFFFFF & measureResult;

    const float* measuredWidth = reinterpret_cast<float*>(&wBits);
    const float* measuredHeight = reinterpret_cast<float*>(&hBits);

    return YGSize{*measuredWidth, *measuredHeight};
  } else {
    YGLog(
        node,
        YGLogLevelError,
        "Java YGNode was GCed during layout calculation\n");
    return YGSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

struct JYogaLogLevel : public JavaClass<JYogaLogLevel> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogLevel;";
};

static int YGJNILogFunc(
    const YGConfigRef config,
    const YGNodeRef node,
    YGLogLevel level,
    const char* format,
    va_list args) {
  int result = vsnprintf(NULL, 0, format, args);
  std::vector<char> buffer(1 + result);
  vsnprintf(buffer.data(), buffer.size(), format, args);

  static auto logFunc =
      findClassStatic("com/facebook/yoga/YogaLogger")
          ->getMethod<void(
              local_ref<JYogaNode>, local_ref<JYogaLogLevel>, jstring)>("log");

  static auto logLevelFromInt =
      JYogaLogLevel::javaClassStatic()
          ->getStaticMethod<JYogaLogLevel::javaobject(jint)>("fromInt");

  if (auto obj = YGNodeJobject(node)->lockLocal()) {
    auto jlogger =
        reinterpret_cast<global_ref<jobject>*>(YGConfigGetContext(config));
    logFunc(
        jlogger->get(),
        obj,
        logLevelFromInt(
            JYogaLogLevel::javaClassStatic(), static_cast<jint>(level)),
        Environment::current()->NewStringUTF(buffer.data()));
  }

  return result;
}

jlong jni_YGNodeNew(alias_ref<jobject> thiz) {
  const YGNodeRef node = YGNodeNew();
  node->setContext(new weak_ref<jobject>(make_weak(thiz)));
  // YGNodeSetContext(node, new weak_ref<jobject>(make_weak(thiz)));
  node->setPrintFunc(YGPrint);
  // YGNodeSetPrintFunc(node, YGPrint);
  return reinterpret_cast<jlong>(node);
}

jlong jni_YGNodeNewWithConfig(alias_ref<jobject> thiz, jlong configPointer) {
  const YGNodeRef node = YGNodeNewWithConfig(_jlong2YGConfigRef(configPointer));
  node->setContext(new weak_ref<jobject>(make_weak(thiz)));
  node->setPrintFunc(YGPrint);
  return reinterpret_cast<jlong>(node);
}

void jni_YGNodeSetOwner(jlong nativePointer, jlong newOwnerNativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  const YGNodeRef newOwnerNode = _jlong2YGNodeRef(newOwnerNativePointer);

  node->setOwner(newOwnerNode);
}

jlong jni_YGNodeClone(
    alias_ref<jobject> thiz,
    jlong nativePointer,
    alias_ref<jobject> clonedJavaObject) {
  const YGNodeRef clonedYogaNode = YGNodeClone(_jlong2YGNodeRef(nativePointer));
  clonedYogaNode->setContext(
      new weak_ref<jobject>(make_weak(clonedJavaObject)));
  return reinterpret_cast<jlong>(clonedYogaNode);
}

void jni_YGNodeFree(jlong nativePointer) {
  if (nativePointer == 0) {
    return;
  }
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  delete YGNodeJobject(node);
  YGNodeFree(node);
}

void jni_YGNodeClearChildren(jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  node->clearChildren();
}

void jni_YGNodeReset(jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  void* context = node->getContext();
  YGNodeReset(node);
  node->setContext(context);
  node->setPrintFunc(YGPrint);
}

void jni_YGNodePrint(jlong nativePointer) {
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodePrint(
      node,
      (YGPrintOptions)(
          YGPrintOptionsStyle | YGPrintOptionsLayout | YGPrintOptionsChildren));
}

void jni_YGNodeInsertChild(
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeInsertChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer), index);
}

void jni_YGNodeInsertSharedChild(
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeInsertSharedChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer), index);
}

void jni_YGNodeRemoveChild(jlong nativePointer, jlong childPointer) {
  YGNodeRemoveChild(
      _jlong2YGNodeRef(nativePointer), _jlong2YGNodeRef(childPointer));
}

void jni_YGNodeSetIsReferenceBaseline(
    jlong nativePointer,
    jboolean isReferenceBaseline) {
  YGNodeSetIsReferenceBaseline(
      _jlong2YGNodeRef(nativePointer), isReferenceBaseline);
}

jboolean jni_YGNodeIsReferenceBaseline(jlong nativePointer) {
  return YGNodeIsReferenceBaseline(_jlong2YGNodeRef(nativePointer));
}

void jni_YGNodeCalculateLayout(
    alias_ref<jclass>,
    jlong nativePointer,
    jfloat width,
    jfloat height) {
  const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
  YGNodeCalculateLayout(
      root,
      static_cast<float>(width),
      static_cast<float>(height),
      YGNodeStyleGetDirection(_jlong2YGNodeRef(nativePointer)));
  YGTransferLayoutOutputsRecursive(root);
}

void jni_YGNodeMarkDirty(jlong nativePointer) {
  YGNodeMarkDirty(_jlong2YGNodeRef(nativePointer));
}

void jni_YGNodeMarkDirtyAndPropogateToDescendants(jlong nativePointer) {
  YGNodeMarkDirtyAndPropogateToDescendants(_jlong2YGNodeRef(nativePointer));
}

jboolean jni_YGNodeIsDirty(jlong nativePointer) {
  return (jboolean)_jlong2YGNodeRef(nativePointer)->isDirty();
}

void jni_YGNodeSetHasMeasureFunc(jlong nativePointer, jboolean hasMeasureFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setMeasureFunc(hasMeasureFunc ? YGJNIMeasureFunc : nullptr);
}

void jni_YGNodeSetHasBaselineFunc(
    jlong nativePointer,
    jboolean hasBaselineFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setBaseLineFunc(hasBaselineFunc ? YGJNIBaselineFunc : nullptr);
}

void jni_YGNodeCopyStyle(jlong dstNativePointer, jlong srcNativePointer) {
  YGNodeCopyStyle(
      _jlong2YGNodeRef(dstNativePointer), _jlong2YGNodeRef(srcNativePointer));
}

struct JYogaValue : public JavaClass<JYogaValue> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/yoga/YogaValue;";

  static local_ref<javaobject> create(YGValue value) {
    return newInstance(value.value, static_cast<int>(value.unit));
  }
};

#define YG_NODE_JNI_STYLE_PROP(javatype, type, name)                        \
  javatype jni_YGNodeStyleGet##name(jlong nativePointer) {                  \
    return (javatype)YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)); \
  }                                                                         \
                                                                            \
  void jni_YGNodeStyleSet##name(jlong nativePointer, javatype value) {      \
    YGNodeStyleSet##name(                                                   \
        _jlong2YGNodeRef(nativePointer), static_cast<type>(value));         \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP(name)                                     \
  local_ref<jobject> jni_YGNodeStyleGet##name(                                \
      alias_ref<jobject>, jlong nativePointer) {                              \
    return JYogaValue::create(                                                \
        YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)));               \
  }                                                                           \
                                                                              \
  void jni_YGNodeStyleSet##name(jlong nativePointer, jfloat value) {          \
    YGNodeStyleSet##name(                                                     \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value));          \
  }                                                                           \
                                                                              \
  void jni_YGNodeStyleSet##name##Percent(jlong nativePointer, jfloat value) { \
    YGNodeStyleSet##name##Percent(                                            \
        _jlong2YGNodeRef(nativePointer), static_cast<float>(value));          \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(name)                   \
  YG_NODE_JNI_STYLE_UNIT_PROP(name)                              \
  void jni_YGNodeStyleSet##name##Auto(jlong nativePointer) {     \
    YGNodeStyleSet##name##Auto(_jlong2YGNodeRef(nativePointer)); \
  }

#define YG_NODE_JNI_STYLE_EDGE_PROP(javatype, type, name)             \
  javatype jni_YGNodeStyleGet##name(jlong nativePointer, jint edge) { \
    return (javatype)YGNodeStyleGet##name(                            \
        _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge));  \
  }                                                                   \
                                                                      \
  void jni_YGNodeStyleSet##name(                                      \
      jlong nativePointer, jint edge, javatype value) {               \
    YGNodeStyleSet##name(                                             \
        _jlong2YGNodeRef(nativePointer),                              \
        static_cast<YGEdge>(edge),                                    \
        static_cast<type>(value));                                    \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                        \
  local_ref<jobject> jni_YGNodeStyleGet##name(                        \
      alias_ref<jobject>, jlong nativePointer, jint edge) {           \
    return JYogaValue::create(YGNodeStyleGet##name(                   \
        _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge))); \
  }                                                                   \
                                                                      \
  void jni_YGNodeStyleSet##name(                                      \
      jlong nativePointer, jint edge, jfloat value) {                 \
    YGNodeStyleSet##name(                                             \
        _jlong2YGNodeRef(nativePointer),                              \
        static_cast<YGEdge>(edge),                                    \
        static_cast<float>(value));                                   \
  }                                                                   \
                                                                      \
  void jni_YGNodeStyleSet##name##Percent(                             \
      jlong nativePointer, jint edge, jfloat value) {                 \
    YGNodeStyleSet##name##Percent(                                    \
        _jlong2YGNodeRef(nativePointer),                              \
        static_cast<YGEdge>(edge),                                    \
        static_cast<float>(value));                                   \
  }

#define YG_NODE_JNI_STYLE_EDGE_UNIT_PROP_AUTO(name)                     \
  YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(name)                                \
  void jni_YGNodeStyleSet##name##Auto(jlong nativePointer, jint edge) { \
    YGNodeStyleSet##name##Auto(                                         \
        _jlong2YGNodeRef(nativePointer), static_cast<YGEdge>(edge));    \
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

void jni_YGNodeStyleSetFlex(jlong nativePointer, jfloat value) {
  YGNodeStyleSetFlex(
      _jlong2YGNodeRef(nativePointer), static_cast<float>(value));
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
  auto context = reinterpret_cast<YGConfigContext*>(YGConfigGetContext(config));
  if (context) {
    delete context;
  }
  YGConfigFree(config);
}

void jni_YGConfigSetExperimentalFeatureEnabled(
    alias_ref<jobject>,
    jlong nativePointer,
    jint feature,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetExperimentalFeatureEnabled(
      config, static_cast<YGExperimentalFeature>(feature), enabled);
}

void jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    alias_ref<jobject>,
    jlong nativePointer,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(config, enabled);
}

void jni_YGConfigSetUseWebDefaults(
    alias_ref<jobject>,
    jlong nativePointer,
    jboolean useWebDefaults) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseWebDefaults(config, useWebDefaults);
}

void jni_YGConfigSetPrintTreeFlag(
    alias_ref<jobject>,
    jlong nativePointer,
    jboolean enable) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPrintTreeFlag(config, enable);
}

void jni_YGConfigSetPointScaleFactor(
    alias_ref<jobject>,
    jlong nativePointer,
    jfloat pixelsInPoint) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPointScaleFactor(config, pixelsInPoint);
}

void jni_YGConfigSetUseLegacyStretchBehaviour(
    alias_ref<jobject>,
    jlong nativePointer,
    jboolean useLegacyStretchBehaviour) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseLegacyStretchBehaviour(config, useLegacyStretchBehaviour);
}

void jni_YGConfigSetHasCloneNodeFunc(
    alias_ref<jobject> thiz,
    jlong nativePointer,
    jboolean hasCloneNodeFunc) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  auto context = reinterpret_cast<YGConfigContext*>(YGConfigGetContext(config));
  if (context && context->config) {
    delete context->config;
    context->config = nullptr;
  }

  if (hasCloneNodeFunc) {
    if (!context) {
      context = new YGConfigContext();
      YGConfigSetContext(config, context);
    }
    context->config = new global_ref<jobject>(make_global(thiz));
    YGConfigSetCloneNodeFunc(config, YGJNIOnNodeClonedFunc);
  } else {
    YGConfigSetCloneNodeFunc(config, nullptr);
  }
}

void jni_YGConfigSetLogger(
    alias_ref<jobject>,
    jlong nativePointer,
    alias_ref<jobject> logger) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  auto context = reinterpret_cast<YGConfigContext*>(YGConfigGetContext(config));
  if (context && context->logger) {
    delete context->logger;
    context->logger = nullptr;
  }

  if (logger) {
    if (!context) {
      context = new YGConfigContext();
      YGConfigSetContext(config, context);
    }
    context->logger = new global_ref<jobject>(make_global(logger));
    YGConfigSetLogger(config, YGJNILogFunc);
  } else {
    YGConfigSetLogger(config, NULL);
  }
}

jint jni_YGNodeGetInstanceCount() {
  return YGNodeGetInstanceCount();
}

#define YGMakeNativeMethod(name) makeNativeMethod(#name, name)
#define YGMakeCriticalNativeMethod(name) makeCriticalNativeMethod(#name, name)

jint JNI_OnLoad(JavaVM* vm, void*) {
  return initialize(vm, [] {
    registerNatives(
        "com/facebook/yoga/YogaNode",
        {
            YGMakeNativeMethod(jni_YGNodeNew),
            YGMakeNativeMethod(jni_YGNodeNewWithConfig),
            YGMakeCriticalNativeMethod(jni_YGNodeFree),
            YGMakeCriticalNativeMethod(jni_YGNodeReset),
            YGMakeCriticalNativeMethod(jni_YGNodeClearChildren),
            YGMakeCriticalNativeMethod(jni_YGNodeInsertChild),
            YGMakeCriticalNativeMethod(jni_YGNodeInsertSharedChild),
            YGMakeCriticalNativeMethod(jni_YGNodeRemoveChild),
            YGMakeCriticalNativeMethod(jni_YGNodeSetIsReferenceBaseline),
            YGMakeCriticalNativeMethod(jni_YGNodeIsReferenceBaseline),
            YGMakeNativeMethod(jni_YGNodeCalculateLayout),
            YGMakeCriticalNativeMethod(jni_YGNodeMarkDirty),
            YGMakeCriticalNativeMethod(
                jni_YGNodeMarkDirtyAndPropogateToDescendants),
            YGMakeCriticalNativeMethod(jni_YGNodeIsDirty),
            YGMakeCriticalNativeMethod(jni_YGNodeSetHasMeasureFunc),
            YGMakeCriticalNativeMethod(jni_YGNodeSetHasBaselineFunc),
            YGMakeCriticalNativeMethod(jni_YGNodeCopyStyle),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetDirection),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetDirection),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexDirection),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexDirection),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetJustifyContent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetJustifyContent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetAlignItems),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetAlignItems),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetAlignSelf),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetAlignSelf),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetAlignContent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetAlignContent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetPositionType),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPositionType),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexWrap),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetOverflow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetOverflow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetDisplay),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetDisplay),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlex),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexGrow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexGrow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexShrink),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexShrink),
            YGMakeNativeMethod(jni_YGNodeStyleGetFlexBasis),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasis),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasisPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasisAuto),
            YGMakeNativeMethod(jni_YGNodeStyleGetMargin),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMargin),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMarginPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMarginAuto),
            YGMakeNativeMethod(jni_YGNodeStyleGetPadding),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPadding),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPaddingPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetBorder),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetBorder),
            YGMakeNativeMethod(jni_YGNodeStyleGetPosition),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPosition),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPositionPercent),
            YGMakeNativeMethod(jni_YGNodeStyleGetWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidthPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidthAuto),
            YGMakeNativeMethod(jni_YGNodeStyleGetHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeightPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeightAuto),
            YGMakeNativeMethod(jni_YGNodeStyleGetMinWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinWidthPercent),
            YGMakeNativeMethod(jni_YGNodeStyleGetMinHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinHeightPercent),
            YGMakeNativeMethod(jni_YGNodeStyleGetMaxWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxWidthPercent),
            YGMakeNativeMethod(jni_YGNodeStyleGetMaxHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxHeightPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetAspectRatio),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetAspectRatio),
            YGMakeCriticalNativeMethod(jni_YGNodeGetInstanceCount),
            YGMakeCriticalNativeMethod(jni_YGNodePrint),
            YGMakeNativeMethod(jni_YGNodeClone),
            YGMakeCriticalNativeMethod(jni_YGNodeSetOwner),
        });
    registerNatives(
        "com/facebook/yoga/YogaConfig",
        {
            YGMakeNativeMethod(jni_YGConfigNew),
            YGMakeNativeMethod(jni_YGConfigFree),
            YGMakeNativeMethod(jni_YGConfigSetExperimentalFeatureEnabled),
            YGMakeNativeMethod(jni_YGConfigSetUseWebDefaults),
            YGMakeNativeMethod(jni_YGConfigSetPrintTreeFlag),
            YGMakeNativeMethod(jni_YGConfigSetPointScaleFactor),
            YGMakeNativeMethod(jni_YGConfigSetUseLegacyStretchBehaviour),
            YGMakeNativeMethod(jni_YGConfigSetLogger),
            YGMakeNativeMethod(jni_YGConfigSetHasCloneNodeFunc),
            YGMakeNativeMethod(
                jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour),
        });
  });
}
