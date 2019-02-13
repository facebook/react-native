/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowViewMutation.h"

namespace facebook {
namespace react {

ShadowViewMutation ShadowViewMutation::CreateMutation(ShadowView shadowView) {
  return {
      Create, // type
      {}, // parentShadowView
      shadowView, // newChildShadowView
      {}, // oldChildShadowView
      -1, // index
  };
}

ShadowViewMutation ShadowViewMutation::DeleteMutation(ShadowView shadowView) {
  return {
      Delete, // type
      {}, // parentShadowView
      shadowView, // oldChildShadowView
      {}, // newChildShadowView
      -1, // index
  };
}

ShadowViewMutation ShadowViewMutation::InsertMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      Insert, // type
      parentShadowView, // parentShadowView
      {}, // oldChildShadowView
      childShadowView, // newChildShadowView
      index, // index
  };
}

ShadowViewMutation ShadowViewMutation::RemoveMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      Remove, // type
      parentShadowView, // parentShadowView
      childShadowView, // oldChildShadowView
      {}, // newChildShadowView
      index, // index
  };
}

ShadowViewMutation ShadowViewMutation::UpdateMutation(
    ShadowView parentShadowView,
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    int index) {
  return {
      Update, // type
      parentShadowView, // parentShadowView
      oldChildShadowView, // oldChildShadowView
      newChildShadowView, // newChildShadowView
      index, // index
  };
}

} // namespace react
} // namespace facebook
