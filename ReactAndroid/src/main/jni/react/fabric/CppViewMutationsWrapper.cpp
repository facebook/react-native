/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CppViewMutationsWrapper.h"

#include <react/renderer/core/ReactPrimitives.h>

#include <fbjni/fbjni.h>
#include <glog/logging.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

jni::local_ref<CppViewMutationsWrapper::jhybriddata>
CppViewMutationsWrapper::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void CppViewMutationsWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", CppViewMutationsWrapper::initHybrid),
      makeNativeMethod(
          "runCppViewMutations", CppViewMutationsWrapper::runCppViewMutations),
  });
}

void CppViewMutationsWrapper::runCppViewMutations() {
  // TODO implement rendering logic:
  // - caching of componengtManagers of views into maps
  // - caching of allocated views
  // - logic for each mutation instruction
  // - Define API in ComponentManager
  // - Define API in Component
  // - see RCTMountingManager.mm for logic
  for (const auto &mutation : *cppViewMutations) {
    const auto &newChildShadowView = mutation.newChildShadowView;
    auto &mutationType = mutation.type;
    auto componentName = newChildShadowView.componentName;
    auto tag = mutation.newChildShadowView.tag;

    switch (mutationType) {
      case ShadowViewMutation::Create: {
        auto component = cppComponentRegistry->createComponentInstance(
            componentName, tag, newChildShadowView.props);
        break;
      }
      case ShadowViewMutation::Remove: {
        auto parentTag = mutation.parentShadowView.tag;
        auto parentComponent =
            cppComponentRegistry->getComponentInstance(parentTag);
        auto childComponent = cppComponentRegistry->getComponentInstance(
            mutation.newChildShadowView.tag);
        parentComponent->unmountChildComponent(childComponent, mutation.index);
        break;
      }
      case ShadowViewMutation::Delete: {
        cppComponentRegistry->deleteComponentInstance(tag);
        break;
      }
      case ShadowViewMutation::Update: {
        auto component = cppComponentRegistry->getComponentInstance(tag);
        if (mutation.oldChildShadowView.props !=
            mutation.newChildShadowView.props) {
          component->updateProps(
              mutation.oldChildShadowView.props,
              mutation.newChildShadowView.props);
        }
        break;
      }
      case ShadowViewMutation::Insert: {
        auto parentTag = mutation.parentShadowView.tag;
        auto parentComponent =
            cppComponentRegistry->getComponentInstance(parentTag);
        auto childTag = mutation.newChildShadowView.tag;
        auto childComponent =
            cppComponentRegistry->getComponentInstance(childTag);
        auto oldProps = mutation.oldChildShadowView.props;
        auto newProps = mutation.newChildShadowView.props;
        childComponent->updateProps(oldProps, newProps);

        if (childComponent && parentComponent) {
          parentComponent->mountChildComponent(childComponent, mutation.index);
        }
        break;
      }
      default: {
        break;
      }
    }
  }
}

} // namespace react
} // namespace facebook
