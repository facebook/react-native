/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CppComponentRegistry.h"
#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>

using namespace facebook::jsi;

namespace facebook {
namespace react {

jni::local_ref<CppComponentRegistry::jhybriddata>
CppComponentRegistry::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void CppComponentRegistry::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", CppComponentRegistry::initHybrid),
  });
}

void CppComponentRegistry::addComponentManager(
    std::string name,
    bool isRootComponent,
    std::function<std::shared_ptr<facebook::react::ComponentManager>(
        const std::string &name)> f) {
  componentManagerResolver_.addComponentManager(name, isRootComponent, f);
}

bool CppComponentRegistry::containsComponentManager(std::string name) const {
  return componentManagerResolver_.containsComponentManager(name);
}

std::shared_ptr<facebook::react::ComponentManager>
CppComponentRegistry::getComponentManager(const std::string &name) const {
  return componentManagerResolver_.getComponentManager(name);
}

std::shared_ptr<facebook::react::Component>
CppComponentRegistry::getComponentInstance(Tag tag) const {
  return components_[tag];
}

bool CppComponentRegistry::isRootComponent(std::string name) const {
  return componentManagerResolver_.isRootComponent(name);
}

std::shared_ptr<facebook::react::Component>
CppComponentRegistry::createComponentInstance(
    const std::string &componentName,
    Tag tag,
    Props::Shared initialProps) const {
  // TODO: cache component managers
  auto componentManager = getComponentManager(componentName);
  auto component = componentManager->createComponent(tag, initialProps);
  components_[tag] = component;
  return component;
}

void CppComponentRegistry::deleteComponentInstance(Tag tag) const {
  components_.erase(tag);
}

} // namespace react
} // namespace facebook
