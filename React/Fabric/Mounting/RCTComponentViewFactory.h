/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponentViewDescriptor.h>
#import <React/RCTComponentViewProtocol.h>

#import <react/uimanager/ComponentDescriptorRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTComponentViewFactoryDelegate <NSObject>

/**
 * Given a component name, return its actual class. If component with doesn't exist, nil is returned.
 * Can be called on any thread.
 */
- (Class<RCTComponentViewProtocol>)componentViewClassWithName:(facebook::react::ComponentName)name;

@end

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (RCTComponentViewFactory *)standardComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<RCTComponentViewProtocol>)componentViewClass;

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

@property (atomic, weak, nullable) id<RCTComponentViewFactoryDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
