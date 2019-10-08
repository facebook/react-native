/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
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

namespace {

union YGNodeContext {
  uintptr_t edgesSet = 0;
  void* asVoidPtr;
};

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
