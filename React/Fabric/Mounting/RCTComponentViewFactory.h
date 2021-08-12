/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewDescriptor.h>
#import <React/RCTComponentViewProtocol.h>
#import <jsi/jsi.h>
#import <react/renderer/componentregistry/ComponentDescriptorRegistry.h>

NS_ASSUME_NONNULL_BEGIN

void RCTInstallNativeComponentRegistryBinding(facebook::jsi::Runtime &runtime);

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (RCTComponentViewFactory *)currentComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass;

/**
 * Registers component if there is a matching class. Returns true if it matching class is found or the component has
 * already been registered, false otherwise.
 */
- (BOOL)registerComponentIfPossible:(std::string const &)componentName;

/**
 * Creates a component view with given component handle.
 */
- (RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(facebook::react::ComponentHandle)componentHandle;

/**
 * Creates *managed* `ComponentDescriptorRegistry`. After creation, the object continues to store a weak pointer to the
 * registry and update it accordingly to the changes in the object.
 */
- (facebook::react::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (facebook::react::ComponentDescriptorParameters)parameters;

@end

NS_ASSUME_NONNULL_END
