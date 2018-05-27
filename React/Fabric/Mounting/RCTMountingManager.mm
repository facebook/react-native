/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMountingManager.h"

#import <fabric/core/LayoutableShadowNode.h>
#import <React/RCTAssert.h>
#import <React/RCTUtils.h>

#import "RCTComponentViewProtocol.h"
#import "RCTComponentViewRegistry.h"
#import "RCTMountItemProtocol.h"

#import "RCTCreateMountItem.h"
#import "RCTDeleteMountItem.h"
#import "RCTInsertMountItem.h"
#import "RCTRemoveMountItem.h"
#import "RCTUpdatePropsMountItem.h"
#import "RCTUpdateEventHandlersMountItem.h"
#import "RCTUpdateLocalDataMountItem.h"
#import "RCTUpdateLayoutMetricsMountItem.h"

using namespace facebook::react;

@implementation RCTMountingManager

- (instancetype)init
{
  if (self = [super init]) {
    _componentViewRegistry = [[RCTComponentViewRegistry alloc] init];
  }

  return self;
}

- (void)mutateComponentViewTreeWithMutationInstructions:(facebook::react::TreeMutationInstructionList)instructions
                                                rootTag:(ReactTag)rootTag
{
  NSMutableArray<RCTMountItemProtocol> *mountItems =
    [[NSMutableArray<RCTMountItemProtocol> alloc] initWithCapacity:instructions.size() * 2 /* ~ the worst case */];

  for (auto instruction : instructions) {
    switch (instruction.getType()) {
      case TreeMutationInstruction::Creation: {
        NSString *componentName = [NSString stringWithCString:instruction.getNewChildNode()->getComponentName().c_str()
                                                     encoding:NSASCIIStringEncoding];
        RCTCreateMountItem *mountItem =
          [[RCTCreateMountItem alloc] initWithComponentName:componentName
                                                        tag:instruction.getNewChildNode()->getTag()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Deletion: {
        NSString *componentName = [NSString stringWithCString:instruction.getOldChildNode()->getComponentName().c_str()
                                                     encoding:NSASCIIStringEncoding];
        RCTDeleteMountItem *mountItem =
          [[RCTDeleteMountItem alloc] initWithComponentName:componentName
                                                        tag:instruction.getOldChildNode()->getTag()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Insertion: {
        // Props
        [mountItems addObject:[[RCTUpdatePropsMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                  oldProps:nullptr
                                                                  newProps:instruction.getNewChildNode()->getProps()]];

        // EventHandlers
        [mountItems addObject:[[RCTUpdateEventHandlersMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                     eventHandlers:instruction.getNewChildNode()->getEventHandlers()]];

        // LocalData
        if (instruction.getNewChildNode()->getLocalData()) {
          [mountItems addObject:[[RCTUpdateLocalDataMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                    oldLocalData:nullptr
                                                                    newLocalData:instruction.getNewChildNode()->getLocalData()]];
        }

        // Layout
        SharedLayoutableShadowNode layoutableNewShadowNode =
          std::dynamic_pointer_cast<const LayoutableShadowNode>(instruction.getNewChildNode());

        if (layoutableNewShadowNode) {
          [mountItems addObject:[[RCTUpdateLayoutMetricsMountItem alloc] initWithTag:instruction.getNewChildNode()->getTag()
                                                                    oldLayoutMetrics:{}
                                                                    newLayoutMetrics:layoutableNewShadowNode->getLayoutMetrics()]];
        }

        // Insertion
        RCTInsertMountItem *mountItem =
        [[RCTInsertMountItem alloc] initWithChildTag:instruction.getNewChildNode()->getTag()
                                           parentTag:instruction.getParentNode()->getTag()
                                               index:instruction.getIndex()];
        [mountItems addObject:mountItem];

        break;
      }

      case TreeMutationInstruction::Removal: {
        RCTRemoveMountItem *mountItem =
          [[RCTRemoveMountItem alloc] initWithChildTag:instruction.getOldChildNode()->getTag()
                                             parentTag:instruction.getParentNode()->getTag()
                                                 index:instruction.getIndex()];
        [mountItems addObject:mountItem];
        break;
      }

      case TreeMutationInstruction::Replacement: {
        SharedShadowNode oldShadowNode = instruction.getOldChildNode();
        SharedShadowNode newShadowNode = instruction.getNewChildNode();

        // Props
        if (oldShadowNode->getProps() != newShadowNode->getProps()) {
          RCTUpdatePropsMountItem *mountItem =
            [[RCTUpdatePropsMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                oldProps:instruction.getOldChildNode()->getProps()
                                                newProps:instruction.getNewChildNode()->getProps()];
          [mountItems addObject:mountItem];
        }

        // EventHandlers
        if (oldShadowNode->getEventHandlers() != newShadowNode->getEventHandlers()) {
          RCTUpdateEventHandlersMountItem *mountItem =
            [[RCTUpdateEventHandlersMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                   eventHandlers:instruction.getOldChildNode()->getEventHandlers()];
          [mountItems addObject:mountItem];
        }

        // LocalData
        if (oldShadowNode->getLocalData() != newShadowNode->getLocalData()) {
          RCTUpdateLocalDataMountItem *mountItem =
            [[RCTUpdateLocalDataMountItem alloc] initWithTag:newShadowNode->getTag()
                                                oldLocalData:oldShadowNode->getLocalData()
                                                newLocalData:newShadowNode->getLocalData()];
          [mountItems addObject:mountItem];
        }

        // Layout
        SharedLayoutableShadowNode layoutableOldShadowNode =
          std::dynamic_pointer_cast<const LayoutableShadowNode>(oldShadowNode);

        if (layoutableOldShadowNode) {
          SharedLayoutableShadowNode layoutableNewShadowNode =
            std::dynamic_pointer_cast<const LayoutableShadowNode>(newShadowNode);

          if (layoutableOldShadowNode->getLayoutMetrics() != layoutableNewShadowNode->getLayoutMetrics()) {
            RCTUpdateLayoutMetricsMountItem *mountItem =
              [[RCTUpdateLayoutMetricsMountItem alloc] initWithTag:instruction.getOldChildNode()->getTag()
                                                  oldLayoutMetrics:layoutableOldShadowNode->getLayoutMetrics()
                                                  newLayoutMetrics:layoutableNewShadowNode->getLayoutMetrics()];
            [mountItems addObject:mountItem];
          }
        }

        break;
      }
    }
  }

  RCTExecuteOnMainQueue(^{
    [self _performMountItems:mountItems rootTag:rootTag];
  });
}

- (void)_performMountItems:(NSArray<RCTMountItemProtocol> *)mountItems
                   rootTag:(ReactTag)rootTag
{
  RCTAssertMainQueue();

  [self.delegate mountingManager:self willMountComponentsWithRootTag:rootTag];

  for (id<RCTMountItemProtocol> mountItem in mountItems) {
    [mountItem executeWithRegistry:_componentViewRegistry];
  }

  [self.delegate mountingManager:self didMountComponentsWithRootTag:rootTag];
}

@end
