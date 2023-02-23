/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/renderer/core/ShadowNode.h>
#include <memory>

namespace facebook::react::details {
template <typename ShadowNodePointerT, typename ParamT>
ShadowNodePointerT traitCastPointer(ParamT shadowNode) {
  auto expectedTraits =
      std::remove_cv_t<std::remove_pointer_t<ShadowNodePointerT>>::BaseTraits();
  if (!shadowNode || !shadowNode->getTraits().check(expectedTraits.get())) {
    return nullptr;
  }

  return static_cast<ShadowNodePointerT>(shadowNode);
}

template <typename ShadowNodeRefT, typename ParamT>
ShadowNodeRefT traitCastRef(ParamT &&shadowNode) {
  auto expectedTraits =
      std::remove_cv_t<std::remove_reference_t<ShadowNodeRefT>>::BaseTraits();
  if (!shadowNode.getTraits().check(expectedTraits.get())) {
    LOG(FATAL) << "Invalid ShadowNode cast\n"
               << "Expected traits: " << std::hex
               << static_cast<int32_t>(expectedTraits.get()) << "\n"
               << "Actual traits: " << std::hex
               << static_cast<int32_t>(shadowNode.getTraits().get()) << "\n";
  }

  return static_cast<ShadowNodeRefT>(shadowNode);
}

template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT> traitCastShared(
    const std::shared_ptr<ParamT> &shadowNode) {
  auto expectedTraits = std::remove_cv_t<ShadowNodeT>::BaseTraits();
  if (!shadowNode || !shadowNode->getTraits().check(expectedTraits.get())) {
    return nullptr;
  }

  return std::static_pointer_cast<ShadowNodeT>(shadowNode);
}
} // namespace facebook::react::details

namespace facebook::react {

// Cast from one ShadowNode reference to another, terminating if the cast is
// invalid.
template <typename ShadowNodeReferenceT>
ShadowNodeReferenceT traitCast(ShadowNode const &shadowNode) {
  return details::traitCastRef<ShadowNodeReferenceT>(shadowNode);
}
template <typename ShadowNodeReferenceT>
ShadowNodeReferenceT traitCast(ShadowNode &shadowNode) {
  return details::traitCastRef<ShadowNodeReferenceT>(shadowNode);
}

// Cast from one ShadowNode pointer to another, returning nullptr if the cast is
// invalid.
template <typename ShadowNodePointerT>
ShadowNodePointerT traitCast(ShadowNode const *shadowNode) {
  return details::traitCastPointer<ShadowNodePointerT>(shadowNode);
}
template <typename ShadowNodePointerT>
ShadowNodePointerT traitCast(ShadowNode *shadowNode) {
  return details::traitCastPointer<ShadowNodePointerT>(shadowNode);
}

// Cast from one ShadowNode shared_pointer to another, returning nullptr if the
// cast is invalid.
template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT> traitCast(
    const std::shared_ptr<ParamT> &shadowNode) {
  return details::traitCastShared<ShadowNodeT>(shadowNode);
}
template <typename ShadowNodeT, typename ParamT>
std::shared_ptr<ShadowNodeT const> traitCast(
    const std::shared_ptr<ParamT const> &shadowNode) {
  return details::traitCastShared<ShadowNodeT const>(shadowNode);
}

} // namespace facebook::react
