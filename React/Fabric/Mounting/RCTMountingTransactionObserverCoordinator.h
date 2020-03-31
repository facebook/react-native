/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponentViewDescriptor.h>
#import "RCTMountingTransactionObserverCoordinator.h"

#import <better/map.h>
#import <better/set.h>

#import <react/mounting/MountingTransactionMetadata.h>

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
      facebook::react::MountingTransactionMetadata const &metadata) const;
  void notifyObserversMountingTransactionDidMount(
      facebook::react::MountingTransactionMetadata const &metadata) const;

 private:
  facebook::better::map<
      facebook::react::SurfaceId,
      facebook::better::set<RCTComponentViewDescriptor>>
      registry_;
};
