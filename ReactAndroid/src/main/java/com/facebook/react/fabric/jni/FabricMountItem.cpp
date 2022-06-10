/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FabricMountItem.h"

namespace facebook {
namespace react {

CppMountItem CppMountItem::CreateMountItem(ShadowView const &shadowView) {
  return {CppMountItem::Type::Create, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::DeleteMountItem(ShadowView const &shadowView) {
  return {CppMountItem::Type::Delete, {}, shadowView, {}, -1};
}
CppMountItem CppMountItem::InsertMountItem(
    ShadowView const &parentView,
    ShadowView const &shadowView,
    int index) {
  return {CppMountItem::Type::Insert, parentView, {}, shadowView, index};
}
CppMountItem CppMountItem::RemoveMountItem(
    ShadowView const &parentView,
    ShadowView const &shadowView,
    int index) {
  return {CppMountItem::Type::Remove, parentView, shadowView, {}, index};
}
CppMountItem CppMountItem::UpdatePropsMountItem(ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdateProps, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateStateMountItem(ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdateState, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateLayoutMountItem(ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdateLayout, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateEventEmitterMountItem(
    ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdateEventEmitter, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdatePaddingMountItem(
    ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdatePadding, {}, {}, shadowView, -1};
}
CppMountItem CppMountItem::UpdateOverflowInsetMountItem(
    ShadowView const &shadowView) {
  return {CppMountItem::Type::UpdateOverflowInset, {}, {}, shadowView, -1};
}

} // namespace react
} // namespace facebook
