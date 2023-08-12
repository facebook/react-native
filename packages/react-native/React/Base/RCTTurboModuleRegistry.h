/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A protocol that allows TurboModules to do lookup on other TurboModules.
 * Calling these methods may cause a module to be synchronously instantiated.
 */
@protocol RCTTurboModuleRegistry <NSObject>
- (id)moduleForName:(const char *)moduleName;

/**
 * Rationale:
 * When TurboModules lookup other modules by name, we first check the TurboModule
 * registry to see if a TurboModule exists with the respective name. In this case,
 * we don't want a RedBox to be raised if the TurboModule isn't found.
 *
 * This method is deprecated and will be deleted after the migration from
 * TurboModules to TurboModules is complete.
 */
- (id)moduleForName:(const char *)moduleName warnOnLookupFailure:(BOOL)warnOnLookupFailure;
- (BOOL)moduleIsInitialized:(const char *)moduleName;

- (NSArray<NSString *> *)eagerInitModuleNames;
- (NSArray<NSString *> *)eagerInitMainQueueModuleNames;
@end
