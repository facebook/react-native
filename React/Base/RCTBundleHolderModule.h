/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * This protocol should be adopted when a turbo module needs to access the currently loaded JS bundle URL.
 * In bridge-less React Native, it is a replacement for bridge.bundleURL.
 */
@protocol RCTBundleHolderModule

@property (nonatomic, strong, readwrite) NSURL *bundleURL;

@end
