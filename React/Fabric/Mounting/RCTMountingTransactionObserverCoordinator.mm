/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingTransactionObserverCoordinator.h"

#import "RCTMountingTransactionObserving.h"

using namespace facebook::react;

void RCTMountingTransactionObserverCoordinator::registerViewComponentDescriptor(
    RCTComponentViewDescriptor const &componentViewDescriptor,
    SurfaceId surfaceId)
{
  if (!componentViewDescriptor.observesMountingTransactionWillMount &&
      !componentViewDescriptor.observesMountingTransactionDidMount) {
    return;
  }

  auto &surfaceRegistry = registry_[surfaceId];
  assert(surfaceRegistry.count(componentViewDescriptor) == 0);
  surfaceRegistry.insert(componentViewDescriptor);
}

void RCTMountingTransactionObserverCoordinator::unregisterViewComponentDescriptor(
    RCTComponentViewDescriptor const &componentViewDescriptor,
    SurfaceId surfaceId)
{
  if (!componentViewDescriptor.observesMountingTransactionWillMount &&
      !componentViewDescriptor.observesMountingTransactionDidMount) {
    return;
  }

  auto &surfaceRegistry = registry_[surfaceId];
  assert(surfaceRegistry.count(componentViewDescriptor) == 1);
  surfaceRegistry.erase(componentViewDescriptor);
}

void RCTMountingTransactionObserverCoordinator::notifyObserversMountingTransactionWillMount(
    MountingTransactionMetadata const &metadata) const
{
  auto surfaceId = metadata.surfaceId;
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (auto const &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionWillMount) {
      [(id<RCTMountingTransactionObserving>)componentViewDescriptor.view
          mountingTransactionWillMountWithMetadata:metadata];
    }
  }
}

void RCTMountingTransactionObserverCoordinator::notifyObserversMountingTransactionDidMount(
    MountingTransactionMetadata const &metadata) const
{
  auto surfaceId = metadata.surfaceId;
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (auto const &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionDidMount) {
      [(id<RCTMountingTransactionObserving>)componentViewDescriptor.view
          mountingTransactionDidMountWithMetadata:metadata];
    }
  }
}
