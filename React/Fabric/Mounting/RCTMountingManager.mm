/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingManager.h"

#import <React/RCTAssert.h>
#import <React/RCTUtils.h>
#import <react/core/LayoutableShadowNode.h>
#import <react/debug/SystraceSection.h>

#import "RCTComponentViewProtocol.h"
#import "RCTComponentViewRegistry.h"
#import "RCTMountItemProtocol.h"

#import "RCTConversions.h"
#import "RCTCreateMountItem.h"
#import "RCTDeleteMountItem.h"
#import "RCTInsertMountItem.h"
#import "RCTRemoveMountItem.h"
#import "RCTUpdateEventEmitterMountItem.h"
#import "RCTUpdateLayoutMetricsMountItem.h"
#import "RCTUpdateLocalDataMountItem.h"
#import "RCTUpdatePropsMountItem.h"

using namespace facebook::react;

@implementation RCTMountingManager

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[RCTComponentViewRegistry alloc] init];
  }

  return self;
}

- (void)performTransactionWithMutations:(facebook::react::ShadowViewMutationList)mutations rootTag:(ReactTag)rootTag
{
  NSMutableArray<RCTMountItemProtocol> *mountItems;

  {
    // This section is measured separately from `_performMountItems:rootTag:` because that can be asynchronous.
    SystraceSection s("-[RCTMountingManager performTransactionWithMutations:rootTag:]");

    mountItems =
        [[NSMutableArray<RCTMountItemProtocol> alloc] initWithCapacity:mutations.size() * 2 /* ~ the worst case */];

    for (const auto &mutation : mutations) {
      switch (mutation.type) {
        case ShadowViewMutation::Create: {
          RCTCreateMountItem *mountItem =
              [[RCTCreateMountItem alloc] initWithComponentHandle:mutation.newChildShadowView.componentHandle
                                                              tag:mutation.newChildShadowView.tag];
          [mountItems addObject:mountItem];
          break;
        }

        case ShadowViewMutation::Delete: {
          RCTDeleteMountItem *mountItem =
              [[RCTDeleteMountItem alloc] initWithComponentHandle:mutation.oldChildShadowView.componentHandle
                                                              tag:mutation.oldChildShadowView.tag];
          [mountItems addObject:mountItem];
          break;
        }

        case ShadowViewMutation::Insert: {
          // Props
          [mountItems addObject:[[RCTUpdatePropsMountItem alloc] initWithTag:mutation.newChildShadowView.tag
                                                                    oldProps:nullptr
                                                                    newProps:mutation.newChildShadowView.props]];

          // EventEmitter
          [mountItems
              addObject:[[RCTUpdateEventEmitterMountItem alloc] initWithTag:mutation.newChildShadowView.tag
                                                               eventEmitter:mutation.newChildShadowView.eventEmitter]];

          // LocalData
          if (mutation.newChildShadowView.localData) {
            [mountItems
                addObject:[[RCTUpdateLocalDataMountItem alloc] initWithTag:mutation.newChildShadowView.tag
                                                              oldLocalData:nullptr
                                                              newLocalData:mutation.newChildShadowView.localData]];
          }

          // Layout
          if (mutation.newChildShadowView.layoutMetrics != EmptyLayoutMetrics) {
            [mountItems addObject:[[RCTUpdateLayoutMetricsMountItem alloc]
                                           initWithTag:mutation.newChildShadowView.tag
                                      oldLayoutMetrics:{}
                                      newLayoutMetrics:mutation.newChildShadowView.layoutMetrics]];
          }

          // Insertion
          RCTInsertMountItem *mountItem = [[RCTInsertMountItem alloc] initWithChildTag:mutation.newChildShadowView.tag
                                                                             parentTag:mutation.parentShadowView.tag
                                                                                 index:mutation.index];
          [mountItems addObject:mountItem];

          break;
        }

        case ShadowViewMutation::Remove: {
          RCTRemoveMountItem *mountItem = [[RCTRemoveMountItem alloc] initWithChildTag:mutation.oldChildShadowView.tag
                                                                             parentTag:mutation.parentShadowView.tag
                                                                                 index:mutation.index];
          [mountItems addObject:mountItem];
          break;
        }

        case ShadowViewMutation::Update: {
          auto oldChildShadowView = mutation.oldChildShadowView;
          auto newChildShadowView = mutation.newChildShadowView;

          // Props
          if (oldChildShadowView.props != newChildShadowView.props) {
            RCTUpdatePropsMountItem *mountItem =
                [[RCTUpdatePropsMountItem alloc] initWithTag:mutation.oldChildShadowView.tag
                                                    oldProps:mutation.oldChildShadowView.props
                                                    newProps:mutation.newChildShadowView.props];
            [mountItems addObject:mountItem];
          }

          // EventEmitter
          if (oldChildShadowView.eventEmitter != newChildShadowView.eventEmitter) {
            RCTUpdateEventEmitterMountItem *mountItem =
                [[RCTUpdateEventEmitterMountItem alloc] initWithTag:mutation.oldChildShadowView.tag
                                                       eventEmitter:mutation.oldChildShadowView.eventEmitter];
            [mountItems addObject:mountItem];
          }

          // LocalData
          if (oldChildShadowView.localData != newChildShadowView.localData) {
            RCTUpdateLocalDataMountItem *mountItem =
                [[RCTUpdateLocalDataMountItem alloc] initWithTag:newChildShadowView.tag
                                                    oldLocalData:oldChildShadowView.localData
                                                    newLocalData:newChildShadowView.localData];
            [mountItems addObject:mountItem];
          }

          // Layout
          if (oldChildShadowView.layoutMetrics != newChildShadowView.layoutMetrics) {
            RCTUpdateLayoutMetricsMountItem *mountItem =
                [[RCTUpdateLayoutMetricsMountItem alloc] initWithTag:mutation.oldChildShadowView.tag
                                                    oldLayoutMetrics:oldChildShadowView.layoutMetrics
                                                    newLayoutMetrics:newChildShadowView.layoutMetrics];
            [mountItems addObject:mountItem];
          }

          break;
        }
      }
    }
  }

  RCTExecuteOnMainQueue(^{
    [self _performMountItems:mountItems rootTag:rootTag];
  });
}

- (void)_performMountItems:(NSArray<RCTMountItemProtocol> *)mountItems rootTag:(ReactTag)rootTag
{
  SystraceSection s("-[RCTMountingManager _performMountItems:rootTag:]");
  RCTAssertMainQueue();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:rootTag];

  for (id<RCTMountItemProtocol> mountItem in mountItems) {
    [mountItem executeWithRegistry:_componentViewRegistry];
  }

  [self.delegate mountingManager:self didMountComponentsWithRootTag:rootTag];
}

- (void)optimisticallyCreateComponentViewWithComponentHandle:(ComponentHandle)componentHandle
{
  if (RCTIsMainQueue()) {
    // There is no reason to allocate views ahead of time on the main thread.
    return;
  }

  RCTExecuteOnMainQueue(^{
    [self->_componentViewRegistry optimisticallyCreateComponentViewWithComponentHandle:componentHandle];
  });
}

@end
