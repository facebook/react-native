/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponentViewDescriptor.h>
#import "RCTMountingTransactionObserverCoordinator.h"

#import <butter/map.h>
#import <butter/set.h>

#include <react/renderer/mounting/MountingTransaction.h>

class RCTMountingTransactionObserverCoordinator final {
 public:
  /*
   * Registers (and unregisters) specified `componentViewDescriptor` in the
   * registry of views that need to be notified. Does nothing if a particular
   * `componentViewDescriptor` does not listen the events.
   */
  void registerViewComponentDescriptor(
      RCTComponentViewDescriptor const &componentViewDescriptor,
      facebook::react::SurfaceId surfaceId);
  void unregisterViewComponentDescriptor(
      RCTComponentViewDescriptor const &componentViewDescriptor,
      facebook::react::SurfaceId surfaceId);

  /*
   * To be called from `RCTMountingManager`.
   */
  void notifyObserversMountingTransactionWillMount(
      facebook::react::MountingTransaction const &transaction,
      facebook::react::SurfaceTelemetry const &surfaceTelemetry) const;
  void notifyObserversMountingTransactionDidMount(
      facebook::react::MountingTransaction const &transaction,
      facebook::react::SurfaceTelemetry const &surfaceTelemetry) const;

 private:
  facebook::butter::map<
      facebook::react::SurfaceId,
      facebook::butter::set<RCTComponentViewDescriptor>>
      registry_;
};
