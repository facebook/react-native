/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTInitializing.h>
#import <React/RCTLog.h>
#import <React/RCTNativeAnimatedModule.h>
#import <React/RCTNativeAnimatedNodesManager.h>

#import <RCTTypeSafety/RCTConvertHelpers.h>

#import "RCTAnimationPlugins.h"

typedef void (^AnimatedOperation)(RCTNativeAnimatedNodesManager *nodesManager);

@interface RCTNativeAnimatedModule () <RCTInitializing>
@end

@implementation RCTNativeAnimatedModule {
  RCTNativeAnimatedNodesManager *_nodesManager;

  // Operations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;
  NSMutableDictionary<NSNumber *, NSNumber *> *_animIdIsManagedByFabric;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _operations = [NSMutableArray new];
    _preOperations = [NSMutableArray new];
    _animIdIsManagedByFabric = [NSMutableDictionary new];
  }
  return self;
}

- (void)invalidate
{
  [super invalidate];
  [_nodesManager stopAnimationLoop];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] removeDispatchObserver:self];
  [self.bridge.uiManager.observerCoordinator removeObserver:self];
  [self.bridge.surfacePresenter removeObserver:self];
}

- (dispatch_queue_t)methodQueue
{
  // This module needs to be on the same queue as the UIManager to avoid
  // having to lock `_operations` and `_preOperations` since `uiManagerWillPerformMounting`
  // will be called from that queue.
  return RCTGetUIManagerQueue();
}

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _nodesManager = [[RCTNativeAnimatedNodesManager alloc] initWithBridge:self.bridge
                                                       surfacePresenter:bridge.surfacePresenter];
  [bridge.uiManager.observerCoordinator addObserver:self];
  [bridge.surfacePresenter addObserver:self];
}

- (void)initialize
{
  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
}

/*
 * This selector should only be invoked in bridgeless mode, which is not compatible with this non turbo module.
 */
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  RCTLogWarn(@"setSurfacePresenter should only be invoked in RCTNativeAnimatedTurboModule");
}

#pragma mark-- API

RCT_EXPORT_METHOD(createAnimatedNode : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:[NSNumber numberWithDouble:tag] config:config];
  }];
}

RCT_EXPORT_METHOD(updateAnimatedNodeConfig : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager updateAnimatedNodeConfig:[NSNumber numberWithDouble:tag] config:config];
  }];
}

RCT_EXPORT_METHOD(connectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                              childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                                 childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

RCT_EXPORT_METHOD(startAnimatingNode
                  : (double)animationId nodeTag
                  : (double)nodeTag config
                  : (NSDictionary<NSString *, id> *)config endCallback
                  : (RCTResponseSenderBlock)callBack)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:[NSNumber numberWithDouble:animationId]
                             nodeTag:[NSNumber numberWithDouble:nodeTag]
                              config:config
                         endCallback:callBack];
  }];

  RCTExecuteOnMainQueue(^{
    if (![self->_nodesManager isNodeManagedByFabric:[NSNumber numberWithDouble:nodeTag]]) {
      return;
    }

    RCTExecuteOnUIManagerQueue(^{
      self->_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] = @YES;
      [self flushOperationQueues];
    });
  });
}

RCT_EXPORT_METHOD(stopAnimation : (double)animationId)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:[NSNumber numberWithDouble:animationId]];
  }];
  if ([_animIdIsManagedByFabric[[NSNumber numberWithDouble:animationId]] boolValue]) {
    [self flushOperationQueues];
  }
}

RCT_EXPORT_METHOD(setAnimatedNodeValue : (double)nodeTag value : (double)value)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:[NSNumber numberWithDouble:nodeTag] value:[NSNumber numberWithDouble:value]];
  }];
}

RCT_EXPORT_METHOD(setAnimatedNodeOffset : (double)nodeTag offset : (double)offset)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag] offset:[NSNumber numberWithDouble:offset]];
  }];
}

RCT_EXPORT_METHOD(flattenAnimatedNodeOffset : (double)nodeTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(extractAnimatedNodeOffset : (double)nodeTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(connectAnimatedNodeToView : (double)nodeTag viewTag : (double)viewTag)
{
  NSString *viewName = [self.bridge.uiManager viewNameForReactTag:[NSNumber numberWithDouble:viewTag]];
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodeToView:[NSNumber numberWithDouble:nodeTag]
                                    viewTag:[NSNumber numberWithDouble:viewTag]
                                   viewName:viewName];
  }];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView : (double)nodeTag viewTag : (double)viewTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:[NSNumber numberWithDouble:nodeTag]
                                         viewTag:[NSNumber numberWithDouble:viewTag]];
  }];
}

RCT_EXPORT_METHOD(restoreDefaultValues : (double)nodeTag)
{
  [self addPreOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(dropAnimatedNode : (double)tag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:[NSNumber numberWithDouble:tag]];
  }];
}

RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue : (double)tag)
{
  __weak id<RCTValueAnimatedNodeObserver> valueObserver = self;
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag] valueObserver:valueObserver];
  }];
}

RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue : (double)tag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag]];
  }];
}

RCT_EXPORT_METHOD(addAnimatedEventToView
                  : (double)viewTag eventName
                  : (nonnull NSString *)eventName eventMapping
                  : (JS::NativeAnimatedModule::EventMapping &)eventMapping)
{
  NSMutableDictionary *eventMappingDict = [NSMutableDictionary new];
  eventMappingDict[@"nativeEventPath"] = RCTConvertVecToArray(eventMapping.nativeEventPath());

  if (eventMapping.animatedValueTag()) {
    eventMappingDict[@"animatedValueTag"] = @(*eventMapping.animatedValueTag());
  }

  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:[NSNumber numberWithDouble:viewTag]
                               eventName:eventName
                            eventMapping:eventMappingDict];
  }];
}

RCT_EXPORT_METHOD(removeAnimatedEventFromView
                  : (double)viewTag eventName
                  : (nonnull NSString *)eventName animatedNodeTag
                  : (double)animatedNodeTag)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:[NSNumber numberWithDouble:viewTag]
                                    eventName:eventName
                              animatedNodeTag:[NSNumber numberWithDouble:animatedNodeTag]];
  }];
}

RCT_EXPORT_METHOD(getValue : (double)nodeTag saveValueCallback : (RCTResponseSenderBlock)saveValueCallback)
{
  [self addOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager getValue:[NSNumber numberWithDouble:nodeTag] saveCallback:saveValueCallback];
  }];
}

RCT_EXPORT_METHOD(queueAndExecuteBatchedOperations : (NSArray *)operationsAndArgs)
{
  // TODO: implement in the future if we want the same optimization here as on Android
}

#pragma mark-- Batch handling

- (void)addOperationBlock:(AnimatedOperation)operation
{
  [_operations addObject:operation];
}

- (void)addPreOperationBlock:(AnimatedOperation)operation
{
  [_preOperations addObject:operation];
}

- (void)flushOperationQueues
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }
  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  RCTExecuteOnMainQueue(^{
    for (AnimatedOperation operation in preOperations) {
      operation(self->_nodesManager);
    }
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }
    [self->_nodesManager updateAnimations];
  });
}

#pragma mark - RCTSurfacePresenterObserver

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag
{
  RCTAssertMainQueue();
  RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *preOperations = self->_preOperations;
    self->_preOperations = [NSMutableArray new];

    RCTExecuteOnMainQueue(^{
      for (AnimatedOperation preOperation in preOperations) {
        preOperation(self->_nodesManager);
      }
    });
  });
}

- (void)didMountComponentsWithRootTag:(NSInteger)rootTag
{
  RCTAssertMainQueue();
  RCTExecuteOnUIManagerQueue(^{
    NSArray<AnimatedOperation> *operations = self->_operations;
    self->_operations = [NSMutableArray new];

    RCTExecuteOnMainQueue(^{
      for (AnimatedOperation operation in operations) {
        operation(self->_nodesManager);
      }
    });
  });
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(RCTUIManager *)uiManager
{
  if (_preOperations.count == 0 && _operations.count == 0) {
    return;
  }

  NSArray<AnimatedOperation> *preOperations = _preOperations;
  NSArray<AnimatedOperation> *operations = _operations;
  _preOperations = [NSMutableArray new];
  _operations = [NSMutableArray new];

  [uiManager
      prependUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        for (AnimatedOperation operation in preOperations) {
          operation(self->_nodesManager);
        }
      }];
  [uiManager addUIBlock:^(__unused RCTUIManager *manager, __unused NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    for (AnimatedOperation operation in operations) {
      operation(self->_nodesManager);
    }

    [self->_nodesManager updateAnimations];
  }];
}

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  // We need to declare the `onUserDrivenAnimationEnded` for compatibility with the New Architecture
  // even if it will never be fired in the Old Architecture.
  return @[ @"onAnimatedValueUpdate", @"onUserDrivenAnimationEnded" ];
}

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate" body:@{@"tag" : node.nodeTag, @"value" : @(value)}];
}

- (void)eventDispatcherWillDispatchEvent:(id<RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];
  });
}

@end

Class RCTNativeAnimatedModuleCls(void)
{
  return RCTNativeAnimatedModule.class;
}
