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
    const RCTComponentViewDescriptor &componentViewDescriptor,
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
    const RCTComponentViewDescriptor &componentViewDescriptor,
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
    const MountingTransaction &transaction,
    const SurfaceTelemetry &surfaceTelemetry) const
{
  auto surfaceId = transaction.getSurfaceId();
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (const auto &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionWillMount) {
      [(id<RCTMountingTransactionObserving>)componentViewDescriptor.view mountingTransactionWillMount:transaction
                                                                                 withSurfaceTelemetry:surfaceTelemetry];
    }
  }
}

void RCTMountingTransactionObserverCoordinator::notifyObserversMountingTransactionDidMount(
    const MountingTransaction &transaction,
    const SurfaceTelemetry &surfaceTelemetry) const
{
  auto surfaceId = transaction.getSurfaceId();
  auto surfaceRegistryIterator = registry_.find(surfaceId);
  if (surfaceRegistryIterator == registry_.end()) {
    return;
  }
  auto &surfaceRegistry = surfaceRegistryIterator->second;
  for (const auto &componentViewDescriptor : surfaceRegistry) {
    if (componentViewDescriptor.observesMountingTransactionDidMount) {
      [(id<RCTMountingTransactionObserving>)componentViewDescriptor.view mountingTransactionDidMount:transaction
                                                                                withSurfaceTelemetry:surfaceTelemetry];
    }
  }
}
