/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTComponentViewRegistry.h"

#import <Foundation/NSMapTable.h>
#import <React/RCTAssert.h>
#import <React/RCTConstants.h>

#import <React/RCTImageComponentView.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTViewComponentView.h>

#import <butter/map.h>

using namespace facebook;
using namespace facebook::react;

const NSInteger RCTComponentViewRegistryRecyclePoolMaxSize = 1024;

@implementation RCTComponentViewRegistry {
  butter::map<Tag, RCTComponentViewDescriptor> _registry;
  butter::map<ComponentHandle, std::vector<RCTComponentViewDescriptor>> _recyclePool;
}

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewFactory = [RCTComponentViewFactory currentComponentViewFactory];

#if !TARGET_OS_OSX // [macOS]
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleApplicationDidReceiveMemoryWarningNotification)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
#endif // [macOS]
  }

  return self;
}

- (RCTComponentViewDescriptor const &)dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                                                          tag:(Tag)tag
{
  RCTAssertMainQueue();

  RCTAssert(
      _registry.find(tag) == _registry.end(),
      @"RCTComponentViewRegistry: Attempt to dequeue already registered component.");

  auto componentViewDescriptor = [self _dequeueComponentViewWithComponentHandle:componentHandle];
#if !TARGET_OS_OSX // [macOS]
  componentViewDescriptor.view.tag = tag;
#else // [macOS
  componentViewDescriptor.view.reactTag = @(tag);
#endif // macOS]
  auto it = _registry.insert({tag, componentViewDescriptor});
  return it.first->second;
}

- (void)enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                                            tag:(Tag)tag
                        componentViewDescriptor:(RCTComponentViewDescriptor)componentViewDescriptor
{
  RCTAssertMainQueue();

  RCTAssert(
      _registry.find(tag) != _registry.end(), @"RCTComponentViewRegistry: Attempt to enqueue unregistered component.");

  _registry.erase(tag);
#if !TARGET_OS_OSX // [macOS]
  componentViewDescriptor.view.tag = 0;
#else // [macOS
  componentViewDescriptor.view.reactTag = @0;
#endif // macOS]
  [self _enqueueComponentViewWithComponentHandle:componentHandle componentViewDescriptor:componentViewDescriptor];
}

- (RCTComponentViewDescriptor const &)componentViewDescriptorWithTag:(Tag)tag
{
  RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  RCTAssert(iterator != _registry.end(), @"RCTComponentViewRegistry: Attempt to query unregistered component.");
  return iterator->second;
}

- (nullable RCTUIView<RCTComponentViewProtocol> *)findComponentViewWithTag:(Tag)tag // [macOS]
{
  RCTAssertMainQueue();
  auto iterator = _registry.find(tag);
  if (iterator == _registry.end()) {
    return nil;
  }
  return iterator->second.view;
}

- (RCTComponentViewDescriptor)_dequeueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.empty()) {
    return [self.componentViewFactory createComponentViewWithComponentHandle:componentHandle];
  }

  auto componentViewDescriptor = recycledViews.back();
  recycledViews.pop_back();
  return componentViewDescriptor;
}

- (void)_enqueueComponentViewWithComponentHandle:(ComponentHandle)componentHandle
                         componentViewDescriptor:(RCTComponentViewDescriptor)componentViewDescriptor
{
  RCTAssertMainQueue();
  auto &recycledViews = _recyclePool[componentHandle];

  if (recycledViews.size() > RCTComponentViewRegistryRecyclePoolMaxSize) {
    return;
  }

  RCTAssert(
      componentViewDescriptor.view.superview == nil, @"RCTComponentViewRegistry: Attempt to recycle a mounted view.");
  [componentViewDescriptor.view prepareForRecycle];

  recycledViews.push_back(componentViewDescriptor);
}

- (void)handleApplicationDidReceiveMemoryWarningNotification
{
  _recyclePool.clear();
}

@end
