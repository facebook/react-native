/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <fb/fbjni.h>
#include <yoga/YGNode.h>
#include <yoga/Yoga.h>
#include <yoga/Yoga-internal.h>
#include <yoga/log.h>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <map>

#include "YGJTypes.h"

using namespace facebook::jni;
using namespace std;
using facebook::yoga::detail::Log;

enum YGStyleInput {
  LayoutDirection,
  FlexDirection,
  Flex,
  FlexGrow,
  FlexShrink,
  FlexBasis,
  FlexBasisPercent,
  FlexBasisAuto,
  FlexWrap,
  Width,
  WidthPercent,
  WidthAuto,
  MinWidth,
  MinWidthPercent,
  MaxWidth,
  MaxWidthPercent,
  Height,
  HeightPercent,
  HeightAuto,
  MinHeight,
  MinHeightPercent,
  MaxHeight,
  MaxHeightPercent,
  JustifyContent,
  AlignItems,
  AlignSelf,
  AlignContent,
  PositionType,
  AspectRatio,
  Overflow,
  Display,
  Margin,
  MarginPercent,
  MarginAuto,
  Padding,
  PaddingPercent,
  Border,
  Position,
  PositionPercent,
  IsReferenceBaseline,
};

const short int LAYOUT_EDGE_SET_FLAG_INDEX = 0;
const short int LAYOUT_WIDTH_INDEX = 1;
const short int LAYOUT_HEIGHT_INDEX = 2;
const short int LAYOUT_LEFT_INDEX = 3;
const short int LAYOUT_TOP_INDEX = 4;
const short int LAYOUT_DIRECTION_INDEX = 5;
const short int LAYOUT_MARGIN_START_INDEX = 6;
const short int LAYOUT_PADDING_START_INDEX = 10;
const short int LAYOUT_BORDER_START_INDEX = 14;

bool useBatchingForLayoutOutputs;

namespace {

union YGNodeContext {
  uintptr_t edgesSet = 0;
  void* asVoidPtr;
};

const int DOES_LEGACY_STRETCH_BEHAVIOUR = 8;
const int HAS_NEW_LAYOUT = 16;

class YGNodeEdges {
  uintptr_t edges_;

public:
  enum Edge {
    MARGIN = 1,
    PADDING = 2,
    BORDER = 4,
  };

  YGNodeEdges(YGNodeRef node) {
    auto context = YGNodeContext{};
    context.asVoidPtr = node->getContext();
    edges_ = context.edgesSet;
  }

  void setOn(YGNodeRef node) {
    auto context = YGNodeContext{};
    context.edgesSet = edges_;
    node->setContext(context.asVoidPtr);
  }

  bool has(Edge edge) { return (edges_ & edge) == edge; }

  YGNodeEdges& add(Edge edge) {
    edges_ |= edge;
    return *this;
  }

  int get() { return edges_; }
};

struct YogaValue {
  static constexpr jint NAN_BYTES = 0x7fc00000;

  static jlong asJavaLong(const YGValue& value) {
    uint32_t valueBytes = 0;
    memcpy(&valueBytes, &value.value, sizeof valueBytes);
    return ((jlong) value.unit) << 32 | valueBytes;
  }
  constexpr static jlong undefinedAsJavaLong() {
    return ((jlong) YGUnitUndefined) << 32 | NAN_BYTES;
  }
};

} // namespace

static inline local_ref<JYogaNode> YGNodeJobject(
    YGNodeRef node,
    void* layoutContext) {
  return reinterpret_cast<PtrJNodeMap*>(layoutContext)->ref(node);
}

static void YGTransferLayoutDirection(
    YGNodeRef node,
    alias_ref<jobject> javaNode) {
  static auto layoutDirectionField =
      javaNode->getClass()->getField<jint>("mLayoutDirection");
  javaNode->setFieldValue(
      layoutDirectionField, static_cast<jint>(YGNodeLayoutGetDirection(node)));
}

static void YGTransferLayoutOutputsRecursive(
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

  if (useBatchingForLayoutOutputs) {
    bool marginFieldSet = edgesSet.has(YGNodeEdges::MARGIN);
    bool paddingFieldSet = edgesSet.has(YGNodeEdges::PADDING);
    bool borderFieldSet = edgesSet.has(YGNodeEdges::BORDER);

    int fieldFlags = edgesSet.get();
    fieldFlags |= HAS_NEW_LAYOUT;
    if (YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(root)) {
      fieldFlags |= DOES_LEGACY_STRETCH_BEHAVIOUR;
    }

    const int arrSize = 6 + (marginFieldSet ? 4 : 0) +
        (paddingFieldSet ? 4 : 0) + (borderFieldSet ? 4 : 0);
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
      arr[LAYOUT_MARGIN_START_INDEX + 1] =
          YGNodeLayoutGetMargin(root, YGEdgeTop);
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

    static auto arrField = obj->getClass()->getField<jfloatArray>("arr");
    local_ref<jfloatArray> arrFinal = make_float_array(arrSize);
    arrFinal->setRegion(0, arrSize, arr);
    obj->setFieldValue<jfloatArray>(arrField, arrFinal.get());

  } else {
    static auto widthField = obj->getClass()->getField<jfloat>("mWidth");
    static auto heightField = obj->getClass()->getField<jfloat>("mHeight");
    static auto leftField = obj->getClass()->getField<jfloat>("mLeft");
    static auto topField = obj->getClass()->getField<jfloat>("mTop");

    static auto marginLeftField =
        obj->getClass()->getField<jfloat>("mMarginLeft");
    static auto marginTopField =
        obj->getClass()->getField<jfloat>("mMarginTop");
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
    static auto borderTopField =
        obj->getClass()->getField<jfloat>("mBorderTop");
    static auto borderRightField =
        obj->getClass()->getField<jfloat>("mBorderRight");
    static auto borderBottomField =
        obj->getClass()->getField<jfloat>("mBorderBottom");

    static auto hasNewLayoutField =
        obj->getClass()->getField<jboolean>("mHasNewLayout");
    static auto doesLegacyStretchBehaviour =
        obj->getClass()->getField<jboolean>(
            "mDoesLegacyStretchFlagAffectsLayout");

    obj->setFieldValue(widthField, YGNodeLayoutGetWidth(root));
    obj->setFieldValue(heightField, YGNodeLayoutGetHeight(root));
    obj->setFieldValue(leftField, YGNodeLayoutGetLeft(root));
    obj->setFieldValue(topField, YGNodeLayoutGetTop(root));
    obj->setFieldValue<jboolean>(
        doesLegacyStretchBehaviour,
        YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(root));
    obj->setFieldValue<jboolean>(hasNewLayoutField, true);
    YGTransferLayoutDirection(root, obj);

    if (edgesSet.has(YGNodeEdges::MARGIN)) {
      obj->setFieldValue(
          marginLeftField, YGNodeLayoutGetMargin(root, YGEdgeLeft));
      obj->setFieldValue(
          marginTopField, YGNodeLayoutGetMargin(root, YGEdgeTop));
      obj->setFieldValue(
          marginRightField, YGNodeLayoutGetMargin(root, YGEdgeRight));
      obj->setFieldValue(
          marginBottomField, YGNodeLayoutGetMargin(root, YGEdgeBottom));
    }

    if (edgesSet.has(YGNodeEdges::PADDING)) {
      obj->setFieldValue(
          paddingLeftField, YGNodeLayoutGetPadding(root, YGEdgeLeft));
      obj->setFieldValue(
          paddingTopField, YGNodeLayoutGetPadding(root, YGEdgeTop));
      obj->setFieldValue(
          paddingRightField, YGNodeLayoutGetPadding(root, YGEdgeRight));
      obj->setFieldValue(
          paddingBottomField, YGNodeLayoutGetPadding(root, YGEdgeBottom));
    }

    if (edgesSet.has(YGNodeEdges::BORDER)) {
      obj->setFieldValue(
          borderLeftField, YGNodeLayoutGetBorder(root, YGEdgeLeft));
      obj->setFieldValue(
          borderTopField, YGNodeLayoutGetBorder(root, YGEdgeTop));
      obj->setFieldValue(
          borderRightField, YGNodeLayoutGetBorder(root, YGEdgeRight));
      obj->setFieldValue(
          borderBottomField, YGNodeLayoutGetBorder(root, YGEdgeBottom));
    }
  }

  root->setHasNewLayout(false);

  for (uint32_t i = 0; i < YGNodeGetChildCount(root); i++) {
    YGTransferLayoutOutputsRecursive(YGNodeGetChild(root, i), layoutContext);
  }
}

static void YGPrint(YGNodeRef node, void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    cout << obj->toString() << endl;
  } else {
    Log::log(
        node,
        YGLogLevelError,
        nullptr,
        "Java YGNode was GCed during layout calculation\n");
  }
}

static float YGJNIBaselineFunc(
    YGNodeRef node,
    float width,
    float height,
    void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    return obj->baseline(width, height);
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

jlong jni_YGNodeClone(alias_ref<jobject> thiz, jlong nativePointer) {
  auto node = _jlong2YGNodeRef(nativePointer);
  const YGNodeRef clonedYogaNode = YGNodeClone(node);
  clonedYogaNode->setContext(node->getContext());

  return reinterpret_cast<jlong>(clonedYogaNode);
}

static YGSize YGJNIMeasureFunc(
    YGNodeRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode,
    void* layoutContext) {
  if (auto obj = YGNodeJobject(node, layoutContext)) {
    YGTransferLayoutDirection(node, obj);
    const auto measureResult =
        obj->measure(width, widthMode, height, heightMode);

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
      static_cast<global_ref<JYogaLogger>*>(YGConfigGetContext(config));
  if (jloggerPtr != nullptr) {
    if (auto obj = YGNodeJobject(node, layoutContext)) {
      (*jloggerPtr)
          ->log(
              obj,
              JYogaLogLevel::fromInt(level),
              Environment::current()->NewStringUTF(buffer.data()));
    }
  }

  return result;
}

jlong jni_YGNodeNew(alias_ref<jobject> thiz, jboolean useBatching) {
  const YGNodeRef node = YGNodeNew();
  node->setContext(YGNodeContext{}.asVoidPtr);
  node->setPrintFunc(YGPrint);
  useBatchingForLayoutOutputs = useBatching;
  return reinterpret_cast<jlong>(node);
}

jlong jni_YGNodeNewWithConfig(
    alias_ref<jclass>,
    jlong configPointer,
    jboolean useBatching) {
  const YGNodeRef node = YGNodeNewWithConfig(_jlong2YGConfigRef(configPointer));
  node->setContext(YGNodeContext{}.asVoidPtr);
  useBatchingForLayoutOutputs = useBatching;
  return reinterpret_cast<jlong>(node);
}

void jni_YGNodeFree(alias_ref<jclass>, jlong nativePointer) {
  if (nativePointer == 0) {
    return;
  }
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
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
}

void jni_YGNodePrint(jlong nativePointer) {
#ifdef DEBUG
  const YGNodeRef node = _jlong2YGNodeRef(nativePointer);
  YGNodePrint(
      node,
      (YGPrintOptions)(
          YGPrintOptionsStyle | YGPrintOptionsLayout | YGPrintOptionsChildren));
#endif
}

void jni_YGNodeInsertChild(
    jlong nativePointer,
    jlong childPointer,
    jint index) {
  YGNodeInsertChild(
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
    jfloat height,
    alias_ref<JArrayLong> nativePointers,
    alias_ref<JArrayClass<JYogaNode::javaobject>> javaNodes) {

  void* layoutContext = nullptr;
  auto map = PtrJNodeMap{};
  if (nativePointers) {
    map = PtrJNodeMap{nativePointers, javaNodes};
    layoutContext = &map;
  }

  const YGNodeRef root = _jlong2YGNodeRef(nativePointer);
  YGNodeCalculateLayoutWithContext(
      root,
      static_cast<float>(width),
      static_cast<float>(height),
      YGNodeStyleGetDirection(_jlong2YGNodeRef(nativePointer)),
      layoutContext);
  YGTransferLayoutOutputsRecursive(root, layoutContext);
}

void jni_YGNodeMarkDirty(jlong nativePointer) {
  YGNodeMarkDirty(_jlong2YGNodeRef(nativePointer));
}

void jni_YGNodeMarkDirtyAndPropogateToDescendants(jlong nativePointer) {
  YGNodeMarkDirtyAndPropogateToDescendants(_jlong2YGNodeRef(nativePointer));
}

jboolean jni_YGNodeIsDirty(jlong nativePointer) {
  return (jboolean) _jlong2YGNodeRef(nativePointer)->isDirty();
}

void jni_YGNodeSetHasMeasureFunc(jlong nativePointer, jboolean hasMeasureFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setMeasureFunc(hasMeasureFunc ? YGJNIMeasureFunc : nullptr);
}

void jni_YGNodeSetHasBaselineFunc(
    jlong nativePointer,
    jboolean hasBaselineFunc) {
  _jlong2YGNodeRef(nativePointer)
      ->setBaselineFunc(hasBaselineFunc ? YGJNIBaselineFunc : nullptr);
}

void jni_YGNodeCopyStyle(jlong dstNativePointer, jlong srcNativePointer) {
  YGNodeCopyStyle(
      _jlong2YGNodeRef(dstNativePointer), _jlong2YGNodeRef(srcNativePointer));
}

#define YG_NODE_JNI_STYLE_PROP(javatype, type, name)                         \
  javatype jni_YGNodeStyleGet##name(jlong nativePointer) {                   \
    return (javatype) YGNodeStyleGet##name(_jlong2YGNodeRef(nativePointer)); \
  }                                                                          \
                                                                             \
  void jni_YGNodeStyleSet##name(jlong nativePointer, javatype value) {       \
    YGNodeStyleSet##name(                                                    \
        _jlong2YGNodeRef(nativePointer), static_cast<type>(value));          \
  }

#define YG_NODE_JNI_STYLE_UNIT_PROP(name)                                     \
  jlong jni_YGNodeStyleGet##name(jlong nativePointer) {                       \
    return YogaValue::asJavaLong(                                             \
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
    return (javatype) YGNodeStyleGet##name(                           \
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
  jlong jni_YGNodeStyleGet##name(jlong nativePointer, jint edge) {    \
    return YogaValue::asJavaLong(YGNodeStyleGet##name(                \
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

jfloat jni_YGNodeStyleGetFlex(jlong nativePointer) {
  return YGNodeStyleGetFlex(_jlong2YGNodeRef(nativePointer));
}
void jni_YGNodeStyleSetFlex(jlong nativePointer, jfloat value) {
  YGNodeStyleSetFlex(
      _jlong2YGNodeRef(nativePointer), static_cast<float>(value));
}
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
YG_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(FlexBasis);

YG_NODE_JNI_STYLE_EDGE_UNIT_PROP(Position);

YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Width);
YG_NODE_JNI_STYLE_UNIT_PROP(MinWidth);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxWidth);
YG_NODE_JNI_STYLE_UNIT_PROP_AUTO(Height);
YG_NODE_JNI_STYLE_UNIT_PROP(MinHeight);
YG_NODE_JNI_STYLE_UNIT_PROP(MaxHeight);

// Yoga specific properties, not compatible with flexbox specification
YG_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

jlong jni_YGConfigNew(alias_ref<jclass>) {
  return reinterpret_cast<jlong>(YGConfigNew());
}

void jni_YGConfigFree(alias_ref<jclass>, jlong nativePointer) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  // unique_ptr will destruct the underlying global_ref, if present.
  auto context = std::unique_ptr<global_ref<JYogaLogger>>{
      static_cast<global_ref<JYogaLogger>*>(YGConfigGetContext(config))};
  YGConfigFree(config);
}

void jni_YGConfigSetExperimentalFeatureEnabled(
    alias_ref<jclass>,
    jlong nativePointer,
    jint feature,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetExperimentalFeatureEnabled(
      config, static_cast<YGExperimentalFeature>(feature), enabled);
}

void jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    alias_ref<jclass>,
    jlong nativePointer,
    jboolean enabled) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(config, enabled);
}

void jni_YGConfigSetUseWebDefaults(
    alias_ref<jclass>,
    jlong nativePointer,
    jboolean useWebDefaults) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseWebDefaults(config, useWebDefaults);
}

void jni_YGConfigSetPrintTreeFlag(
    alias_ref<jclass>,
    jlong nativePointer,
    jboolean enable) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPrintTreeFlag(config, enable);
}

void jni_YGConfigSetPointScaleFactor(
    alias_ref<jclass>,
    jlong nativePointer,
    jfloat pixelsInPoint) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetPointScaleFactor(config, pixelsInPoint);
}

void jni_YGConfigSetUseLegacyStretchBehaviour(
    alias_ref<jclass>,
    jlong nativePointer,
    jboolean useLegacyStretchBehaviour) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  YGConfigSetUseLegacyStretchBehaviour(config, useLegacyStretchBehaviour);
}

void jni_YGConfigSetLogger(
    alias_ref<jclass>,
    jlong nativePointer,
    alias_ref<jobject> logger) {
  const YGConfigRef config = _jlong2YGConfigRef(nativePointer);
  auto context =
      reinterpret_cast<global_ref<JYogaLogger>*>(YGConfigGetContext(config));

  if (logger) {
    if (context == nullptr) {
      context = new global_ref<JYogaLogger>{};
      YGConfigSetContext(config, context);
    }

    *context = make_global(static_ref_cast<JYogaLogger::javaobject>(logger));
    config->setLogger(YGJNILogFunc);
  } else {
    if (context != nullptr) {
      delete context;
      YGConfigSetContext(config, nullptr);
    }
    config->setLogger(nullptr);
  }
}

static void YGNodeSetStyleInputs(
    const YGNodeRef node,
    float* styleInputs,
    int size) {
  const auto end = styleInputs + size;
  auto edgesSet = YGNodeEdges{node};
  while (styleInputs < end) {
    auto styleInputKey = static_cast<YGStyleInput>((int) *styleInputs++);
    switch (styleInputKey) {
      case LayoutDirection:
        YGNodeStyleSetDirection(node, static_cast<YGDirection>(*styleInputs++));
        break;
      case FlexDirection:
        YGNodeStyleSetFlexDirection(
            node, static_cast<YGFlexDirection>(*styleInputs++));
        break;
      case Flex:
        YGNodeStyleSetFlex(node, *styleInputs++);
        break;
      case FlexGrow:
        YGNodeStyleSetFlexGrow(node, *styleInputs++);
        break;
      case FlexShrink:
        YGNodeStyleSetFlexShrink(node, *styleInputs++);
        break;
      case FlexBasis:
        YGNodeStyleSetFlexBasis(node, *styleInputs++);
        break;
      case FlexBasisPercent:
        YGNodeStyleSetFlexBasisPercent(node, *styleInputs++);
        break;
      case FlexBasisAuto:
        YGNodeStyleSetFlexBasisAuto(node);
        break;
      case FlexWrap:
        YGNodeStyleSetFlexWrap(node, static_cast<YGWrap>(*styleInputs++));
        break;
      case Width:
        YGNodeStyleSetWidth(node, *styleInputs++);
        break;
      case WidthPercent:
        YGNodeStyleSetWidthPercent(node, *styleInputs++);
        break;
      case WidthAuto:
        YGNodeStyleSetWidthAuto(node);
        break;
      case MinWidth:
        YGNodeStyleSetMinWidth(node, *styleInputs++);
        break;
      case MinWidthPercent:
        YGNodeStyleSetMinWidthPercent(node, *styleInputs++);
        break;
      case MaxWidth:
        YGNodeStyleSetMaxWidth(node, *styleInputs++);
        break;
      case MaxWidthPercent:
        YGNodeStyleSetMaxWidthPercent(node, *styleInputs++);
        break;
      case Height:
        YGNodeStyleSetHeight(node, *styleInputs++);
        break;
      case HeightPercent:
        YGNodeStyleSetHeightPercent(node, *styleInputs++);
        break;
      case HeightAuto:
        YGNodeStyleSetHeightAuto(node);
        break;
      case MinHeight:
        YGNodeStyleSetMinHeight(node, *styleInputs++);
        break;
      case MinHeightPercent:
        YGNodeStyleSetMinHeightPercent(node, *styleInputs++);
        break;
      case MaxHeight:
        YGNodeStyleSetMaxHeight(node, *styleInputs++);
        break;
      case MaxHeightPercent:
        YGNodeStyleSetMaxHeightPercent(node, *styleInputs++);
        break;
      case JustifyContent:
        YGNodeStyleSetJustifyContent(
            node, static_cast<YGJustify>(*styleInputs++));
        break;
      case AlignItems:
        YGNodeStyleSetAlignItems(node, static_cast<YGAlign>(*styleInputs++));
        break;
      case AlignSelf:
        YGNodeStyleSetAlignSelf(node, static_cast<YGAlign>(*styleInputs++));
        break;
      case AlignContent:
        YGNodeStyleSetAlignContent(node, static_cast<YGAlign>(*styleInputs++));
        break;
      case PositionType:
        YGNodeStyleSetPositionType(
            node, static_cast<YGPositionType>(*styleInputs++));
        break;
      case AspectRatio:
        YGNodeStyleSetAspectRatio(node, *styleInputs++);
        break;
      case Overflow:
        YGNodeStyleSetOverflow(node, static_cast<YGOverflow>(*styleInputs++));
        break;
      case Display:
        YGNodeStyleSetDisplay(node, static_cast<YGDisplay>(*styleInputs++));
        break;
      case Margin: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float marginValue = *styleInputs++;
        edgesSet.add(YGNodeEdges::MARGIN);
        YGNodeStyleSetMargin(node, edge, marginValue);
        break;
      }
      case MarginPercent: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float marginPercent = *styleInputs++;
        edgesSet.add(YGNodeEdges::MARGIN);
        YGNodeStyleSetMarginPercent(node, edge, marginPercent);
        break;
      }
      case MarginAuto: {
        edgesSet.add(YGNodeEdges::MARGIN);
        YGNodeStyleSetMarginAuto(node, static_cast<YGEdge>(*styleInputs++));
        break;
      }
      case Padding: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float paddingValue = *styleInputs++;
        edgesSet.add(YGNodeEdges::PADDING);
        YGNodeStyleSetPadding(node, edge, paddingValue);
        break;
      }
      case PaddingPercent: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float paddingPercent = *styleInputs++;
        edgesSet.add(YGNodeEdges::PADDING);
        YGNodeStyleSetPaddingPercent(node, edge, paddingPercent);
        break;
      }
      case Border: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float borderValue = *styleInputs++;
        edgesSet.add(YGNodeEdges::BORDER);
        YGNodeStyleSetBorder(node, edge, borderValue);
        break;
      }
      case Position: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float positionValue = *styleInputs++;
        YGNodeStyleSetPosition(node, edge, positionValue);
        break;
      }
      case PositionPercent: {
        auto edge = static_cast<YGEdge>(*styleInputs++);
        float positionPercent = *styleInputs++;
        YGNodeStyleSetPositionPercent(node, edge, positionPercent);
        break;
      }
      case IsReferenceBaseline: {
        YGNodeSetIsReferenceBaseline(node, *styleInputs++ == 1 ? true : false);
        break;
      }
      default:
        break;
    }
  }
  edgesSet.setOn(node);
}

void jni_YGNodeSetStyleInputs(
    alias_ref<jclass>,
    jlong nativePointer,
    alias_ref<JArrayFloat> styleInputs,
    jint size) {
  float result[size];
  styleInputs->getRegion(0, size, result);
  YGNodeSetStyleInputs(_jlong2YGNodeRef(nativePointer), result, size);
}

jlong jni_YGNodeStyleGetMargin(jlong nativePointer, jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::MARGIN)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetMargin(yogaNodeRef, static_cast<YGEdge>(edge)));
}

void jni_YGNodeStyleSetMargin(jlong nativePointer, jint edge, jfloat margin) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMargin(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(margin));
}

void jni_YGNodeStyleSetMarginPercent(
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

void jni_YGNodeStyleSetMarginAuto(jlong nativePointer, jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::MARGIN).setOn(yogaNodeRef);
  YGNodeStyleSetMarginAuto(yogaNodeRef, static_cast<YGEdge>(edge));
}

jlong jni_YGNodeStyleGetPadding(jlong nativePointer, jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::PADDING)) {
    return YogaValue::undefinedAsJavaLong();
  }
  return YogaValue::asJavaLong(
      YGNodeStyleGetPadding(yogaNodeRef, static_cast<YGEdge>(edge)));
}

void jni_YGNodeStyleSetPadding(jlong nativePointer, jint edge, jfloat padding) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPadding(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(padding));
}

void jni_YGNodeStyleSetPaddingPercent(
    jlong nativePointer,
    jint edge,
    jfloat percent) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::PADDING).setOn(yogaNodeRef);
  YGNodeStyleSetPaddingPercent(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(percent));
}

jfloat jni_YGNodeStyleGetBorder(jlong nativePointer, jint edge) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  if (!YGNodeEdges{yogaNodeRef}.has(YGNodeEdges::BORDER)) {
    return (jfloat) YGUndefined;
  }
  return (jfloat) YGNodeStyleGetBorder(yogaNodeRef, static_cast<YGEdge>(edge));
}

void jni_YGNodeStyleSetBorder(jlong nativePointer, jint edge, jfloat border) {
  YGNodeRef yogaNodeRef = _jlong2YGNodeRef(nativePointer);
  YGNodeEdges{yogaNodeRef}.add(YGNodeEdges::BORDER).setOn(yogaNodeRef);
  YGNodeStyleSetBorder(
      yogaNodeRef, static_cast<YGEdge>(edge), static_cast<float>(border));
}

#define YGMakeNativeMethod(name) makeNativeMethod(#name, name)
#define YGMakeCriticalNativeMethod(name) \
  makeCriticalNativeMethod_DO_NOT_USE_OR_YOU_WILL_BE_FIRED(#name, name)

jint JNI_OnLoad(JavaVM* vm, void*) {
  return initialize(vm, [] {
    registerNatives(
        "com/facebook/yoga/YogaNative",
        {
            YGMakeNativeMethod(jni_YGNodeNew),
            YGMakeNativeMethod(jni_YGNodeNewWithConfig),
            YGMakeNativeMethod(jni_YGNodeFree),
            YGMakeCriticalNativeMethod(jni_YGNodeReset),
            YGMakeCriticalNativeMethod(jni_YGNodeClearChildren),
            YGMakeCriticalNativeMethod(jni_YGNodeInsertChild),
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
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexWrap),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexWrap),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetOverflow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetOverflow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetDisplay),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetDisplay),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlex),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlex),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexGrow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexGrow),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexShrink),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexShrink),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetFlexBasis),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasis),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasisPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetFlexBasisAuto),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetMargin),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMargin),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMarginPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMarginAuto),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetPadding),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPadding),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPaddingPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetBorder),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetBorder),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetPosition),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPosition),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetPositionPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidthPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetWidthAuto),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeightPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetHeightAuto),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetMinWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinWidthPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetMinHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMinHeightPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetMaxWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxWidth),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxWidthPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetMaxHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxHeight),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetMaxHeightPercent),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleGetAspectRatio),
            YGMakeCriticalNativeMethod(jni_YGNodeStyleSetAspectRatio),
            YGMakeCriticalNativeMethod(jni_YGNodePrint),
            YGMakeNativeMethod(jni_YGNodeClone),
            YGMakeNativeMethod(jni_YGNodeSetStyleInputs),
            YGMakeNativeMethod(jni_YGConfigNew),
            YGMakeNativeMethod(jni_YGConfigFree),
            YGMakeNativeMethod(jni_YGConfigSetExperimentalFeatureEnabled),
            YGMakeNativeMethod(jni_YGConfigSetUseWebDefaults),
            YGMakeNativeMethod(jni_YGConfigSetPrintTreeFlag),
            YGMakeNativeMethod(jni_YGConfigSetPointScaleFactor),
            YGMakeNativeMethod(jni_YGConfigSetUseLegacyStretchBehaviour),
            YGMakeNativeMethod(jni_YGConfigSetLogger),
            YGMakeNativeMethod(
                jni_YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour),
        });
  });
}
