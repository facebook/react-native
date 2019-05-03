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
      /* .type = */ Create,
      /* .parentShadowView = */ {},
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ shadowView,
      /* .index = */ -1,
  };
}

ShadowViewMutation ShadowViewMutation::DeleteMutation(ShadowView shadowView) {
  return {
      /* .type = */ Delete,
      /* .parentShadowView = */ {},
      /* .oldChildShadowView = */ shadowView,
      /* .newChildShadowView = */ {},
      /* .index = */ -1,
  };
}

ShadowViewMutation ShadowViewMutation::InsertMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ Insert,
      /* .parentShadowView = */ parentShadowView,
      /* .oldChildShadowView = */ {},
      /* .newChildShadowView = */ childShadowView,
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::RemoveMutation(
    ShadowView parentShadowView,
    ShadowView childShadowView,
    int index) {
  return {
      /* .type = */ Remove,
      /* .parentShadowView = */ parentShadowView,
      /* .oldChildShadowView = */ childShadowView,
      /* .newChildShadowView = */ {},
      /* .index = */ index,
  };
}

ShadowViewMutation ShadowViewMutation::UpdateMutation(
    ShadowView parentShadowView,
    ShadowView oldChildShadowView,
    ShadowView newChildShadowView,
    int index) {
  return {
      /* .type = */ Update,
      /* .parentShadowView = */ parentShadowView,
      /* .oldChildShadowView = */ oldChildShadowView,
      /* .newChildShadowView = */ newChildShadowView,
      /* .index = */ index,
  };
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(ShadowViewMutation const &mutation) {
  switch (mutation.type) {
    case ShadowViewMutation::Create:
      return "Create";
    case ShadowViewMutation::Delete:
      return "Delete";
    case ShadowViewMutation::Insert:
      return "Insert";
    case ShadowViewMutation::Remove:
      return "Remove";
    case ShadowViewMutation::Update:
      return "Update";
  }
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    ShadowViewMutation const &mutation,
    DebugStringConvertibleOptions options) {
  return {
      mutation.oldChildShadowView.componentHandle
          ? DebugStringConvertibleObject{"oldChild",
                                         getDebugDescription(
                                             mutation.oldChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.newChildShadowView.componentHandle
          ? DebugStringConvertibleObject{"newChild",
                                         getDebugDescription(
                                             mutation.newChildShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.parentShadowView.componentHandle
          ? DebugStringConvertibleObject{"parent",
                                         getDebugDescription(
                                             mutation.parentShadowView,
                                             options)}
          : DebugStringConvertibleObject{},
      mutation.index != -1
          ? DebugStringConvertibleObject{"index",
                                         getDebugDescription(
                                             mutation.index, options)}
          : DebugStringConvertibleObject{},
  };
}

#endif

} // namespace react
} // namespace facebook
