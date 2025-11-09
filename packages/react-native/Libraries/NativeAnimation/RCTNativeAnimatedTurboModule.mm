/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <React/RCTInitializing.h>
#import <React/RCTNativeAnimatedNodesManager.h>
#import <React/RCTNativeAnimatedTurboModule.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>

#import "RCTAnimationPlugins.h"

typedef void (^AnimatedOperation)(RCTNativeAnimatedNodesManager *nodesManager);

@interface RCTNativeAnimatedTurboModule () <NativeAnimatedModuleSpec, RCTInitializing>
@end

@implementation RCTNativeAnimatedTurboModule {
  RCTNativeAnimatedNodesManager *_nodesManager;
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
  // Operations called after views have been updated.
  NSMutableArray<AnimatedOperation> *_operations;
  // Operations called before views have been updated.
  NSMutableArray<AnimatedOperation> *_preOperations;

  NSSet<NSString *> *_userDrivenAnimationEndedEvents;
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
    _userDrivenAnimationEndedEvents = [NSSet setWithArray:@[ @"onScrollEnded" ]];
  }
  return self;
}

- (void)initialize
{
  // _surfacePresenter set in setSurfacePresenter:
  _nodesManager = [[RCTNativeAnimatedNodesManager alloc] initWithBridge:nil surfacePresenter:_surfacePresenter];
  [_surfacePresenter addObserver:self];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] addDispatchObserver:self];
}

- (void)invalidate
{
  [super invalidate];
  [_nodesManager stopAnimationLoop];
  [[self.moduleRegistry moduleForName:"EventDispatcher"] removeDispatchObserver:self];
  [_surfacePresenter removeObserver:self];
}

/*
 * In bridgeless mode, `setBridge` is never called during initializtion. Instead this selector is invoked via
 * BridgelessTurboModuleSetup.
 */
- (void)setSurfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _surfacePresenter = surfacePresenter;
}

#pragma mark-- API

RCT_EXPORT_METHOD(startOperationBatch) {}

RCT_EXPORT_METHOD(finishOperationBatch) {}

RCT_EXPORT_METHOD(createAnimatedNode : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager createAnimatedNode:[NSNumber numberWithDouble:tag] config:config];
  }];
}

RCT_EXPORT_METHOD(updateAnimatedNodeConfig : (double)tag config : (NSDictionary<NSString *, id> *)config)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager updateAnimatedNodeConfig:[NSNumber numberWithDouble:tag] config:config];
  }];
}

RCT_EXPORT_METHOD(connectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager connectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                              childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodes : (double)parentTag childTag : (double)childTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodes:[NSNumber numberWithDouble:parentTag]
                                 childTag:[NSNumber numberWithDouble:childTag]];
  }];
}

RCT_EXPORT_METHOD(
    startAnimatingNode : (double)animationId nodeTag : (double)nodeTag config : (NSDictionary<NSString *, id> *)
        config endCallback : (RCTResponseSenderBlock)callBack)
{
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startAnimatingNode:[NSNumber numberWithDouble:animationId]
                             nodeTag:[NSNumber numberWithDouble:nodeTag]
                              config:config
                         endCallback:callBack];
  }];
}

RCT_EXPORT_METHOD(stopAnimation : (double)animationId)
{
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopAnimation:[NSNumber numberWithDouble:animationId]];
  }];
}

RCT_EXPORT_METHOD(setAnimatedNodeValue : (double)nodeTag value : (double)value)
{
  [self queueFlushedOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeValue:[NSNumber numberWithDouble:nodeTag] value:[NSNumber numberWithDouble:value]];
  }];
}

RCT_EXPORT_METHOD(setAnimatedNodeOffset : (double)nodeTag offset : (double)offset)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager setAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag] offset:[NSNumber numberWithDouble:offset]];
  }];
}

RCT_EXPORT_METHOD(flattenAnimatedNodeOffset : (double)nodeTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager flattenAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(extractAnimatedNodeOffset : (double)nodeTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager extractAnimatedNodeOffset:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(connectAnimatedNodeToView : (double)nodeTag viewTag : (double)viewTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    // viewName is not used when node is managed by Fabric, and nodes are always managed by Fabric in Bridgeless.
    [nodesManager connectAnimatedNodeToView:[NSNumber numberWithDouble:nodeTag]
                                    viewTag:[NSNumber numberWithDouble:viewTag]
                                   viewName:nil];
  }];
}

RCT_EXPORT_METHOD(disconnectAnimatedNodeFromView : (double)nodeTag viewTag : (double)viewTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager disconnectAnimatedNodeFromView:[NSNumber numberWithDouble:nodeTag]
                                         viewTag:[NSNumber numberWithDouble:viewTag]];
  }];
}

RCT_EXPORT_METHOD(restoreDefaultValues : (double)nodeTag)
{
  [self queuePreOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager restoreDefaultValues:[NSNumber numberWithDouble:nodeTag]];
  }];
}

RCT_EXPORT_METHOD(dropAnimatedNode : (double)tag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager dropAnimatedNode:[NSNumber numberWithDouble:tag]];
  }];
}

RCT_EXPORT_METHOD(startListeningToAnimatedNodeValue : (double)tag)
{
  __weak id<RCTValueAnimatedNodeObserver> valueObserver = self;
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager startListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag] valueObserver:valueObserver];
  }];
}

RCT_EXPORT_METHOD(stopListeningToAnimatedNodeValue : (double)tag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager stopListeningToAnimatedNodeValue:[NSNumber numberWithDouble:tag]];
  }];
}

RCT_EXPORT_METHOD(
    addAnimatedEventToView : (double)viewTag eventName : (nonnull NSString *)
        eventName eventMapping : (JS::NativeAnimatedModule::EventMapping &)eventMapping)
{
  NSMutableDictionary *eventMappingDict = [NSMutableDictionary new];
  eventMappingDict[@"nativeEventPath"] = RCTConvertVecToArray(eventMapping.nativeEventPath());

  if (eventMapping.animatedValueTag()) {
    eventMappingDict[@"animatedValueTag"] = @(*eventMapping.animatedValueTag());
  }

  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager addAnimatedEventToView:[NSNumber numberWithDouble:viewTag]
                               eventName:eventName
                            eventMapping:eventMappingDict];
  }];
}

RCT_EXPORT_METHOD(
    removeAnimatedEventFromView : (double)viewTag eventName : (nonnull NSString *)eventName animatedNodeTag : (double)
        animatedNodeTag)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager removeAnimatedEventFromView:[NSNumber numberWithDouble:viewTag]
                                    eventName:eventName
                              animatedNodeTag:[NSNumber numberWithDouble:animatedNodeTag]];
  }];
}

RCT_EXPORT_METHOD(getValue : (double)nodeTag saveValueCallback : (RCTResponseSenderBlock)saveValueCallback)
{
  [self queueOperationBlock:^(RCTNativeAnimatedNodesManager *nodesManager) {
    [nodesManager getValue:[NSNumber numberWithDouble:nodeTag] saveCallback:saveValueCallback];
  }];
}

RCT_EXPORT_METHOD(queueAndExecuteBatchedOperations : (NSArray *)operationsAndArgs)
{
  // TODO: implement in the future if we want the same optimization here as on Android
}

#pragma mark-- Batch handling

- (void)queueFlushedOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addOperationBlock:operation];
    // In Bridge, flushing of native animations is done from RCTCxxBridge batchDidComplete().
    // Since RCTCxxBridge doesn't exist in Bridgeless, and components are not remounted in Fabric for native
    // animations, flush here for changes in Animated.Value for Animated.event.
    [self flushOperationQueues];
  });
}

- (void)queueOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addOperationBlock:operation];
  });
}

- (void)queuePreOperationBlock:(AnimatedOperation)operation
{
  dispatch_async(RCTGetUIManagerQueue(), ^{
    [self addPreOperationBlock:operation];
  });
}

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

#pragma mark-- Events

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"onAnimatedValueUpdate", @"onUserDrivenAnimationEnded" ];
}

- (void)animatedNode:(RCTValueAnimatedNode *)node didUpdateValue:(CGFloat)value
{
  [self sendEventWithName:@"onAnimatedValueUpdate" body:@{@"tag" : node.nodeTag, @"value" : @(value)}];
}

- (void)userDrivenAnimationEnded:(NSArray<NSNumber *> *)nodes
{
  [self sendEventWithName:@"onUserDrivenAnimationEnded" body:@{@"tags" : nodes}];
}

- (void)eventDispatcherWillDispatchEvent:(id<RCTEvent>)event
{
  // Events can be dispatched from any queue so we have to make sure handleAnimatedEvent
  // is run from the main queue.
  RCTExecuteOnMainQueue(^{
    [self->_nodesManager handleAnimatedEvent:event];

    if ([self->_userDrivenAnimationEndedEvents containsObject:event.eventName]) {
      NSSet<NSNumber *> *tags = [self->_nodesManager getTagsOfConnectedNodesFrom:event.viewTag
                                                                        andEvent:event.eventName];
      if (tags.count > 0) {
        [self userDrivenAnimationEnded:[tags allObjects]];
      }
    }
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAnimatedModuleSpecJSI>(params);
}

@end

Class RCTNativeAnimatedTurboModuleCls(void)
{
  return RCTNativeAnimatedTurboModule.class;
}
