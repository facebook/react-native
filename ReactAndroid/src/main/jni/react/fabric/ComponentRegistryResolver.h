/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/cxxcomponents/ComponentManager.h>

namespace facebook {
namespace react {

struct ComponentResolverData {
  bool isRootComponent;
  std::function<std::shared_ptr<facebook::react::ComponentManager>(
      const std::string &name)>
      getComponentManagerFunction;
};

using ComponentResolverMap = butter::map<std::string, ComponentResolverData>;

class ComponentRegistryResolver {
 public:
  ComponentRegistryResolver(){};

  void addComponentManager(
      std::string name,
      bool isRootComponent,
      std::function<std::shared_ptr<facebook::react::ComponentManager>(
          const std::string &name)> f);

  bool containsComponentManager(std::string componentName) const;

  bool isRootComponent(std::string componentName) const;

  std::shared_ptr<facebook::react::ComponentManager> getComponentManager(
      std::string name) const;

 private:
  butter::map<std::string, ComponentResolverData> resolverMap_{};
};

} // namespace react
} // namespace facebook
