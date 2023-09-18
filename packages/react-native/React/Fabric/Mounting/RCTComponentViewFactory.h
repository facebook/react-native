/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
 * Protocol that can be implemented to provide some 3rd party components to Fabric.
 * Fabric will check in this map whether there are some components that need to be registered.
 */
@protocol RCTComponentViewFactoryComponentProvider <NSObject>

/**
 * Return a dictionary of third party components where the `key` is the Component Handler and the `value` is a Class
 * that conforms to `RCTComponentViewProtocol`.
 */
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

@end

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface RCTComponentViewFactory : NSObject

@property (nonatomic, weak) id<RCTComponentViewFactoryComponentProvider> thirdPartyFabricComponentsProvider;

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
- (BOOL)registerComponentIfPossible:(const std::string &)componentName;

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
