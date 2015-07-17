/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIManager.h"

#import <objc/message.h>

#import <AVFoundation/AVFoundation.h>

#import "Layout.h"
#import "RCTAnimationType.h"
#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTRootView.h"
#import "RCTScrollableProtocol.h"
#import "RCTShadowView.h"
#import "RCTSparseArray.h"
#import "RCTTouchHandler.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewManager.h"
#import "RCTViewNodeProtocol.h"
#import "UIView+React.h"

typedef void (^react_view_node_block_t)(id<RCTViewNodeProtocol>);

static void RCTTraverseViewNodes(id<RCTViewNodeProtocol> view, react_view_node_block_t block)
{
  if (view.reactTag) block(view);
  for (id<RCTViewNodeProtocol> subview in view.reactSubviews) {
    RCTTraverseViewNodes(subview, block);
  }
}

@interface RCTAnimation : NSObject

@property (nonatomic, readonly) NSTimeInterval duration;
@property (nonatomic, readonly) NSTimeInterval delay;
@property (nonatomic, readonly, copy) NSString *property;
@property (nonatomic, readonly) id fromValue;
@property (nonatomic, readonly) id toValue;
@property (nonatomic, readonly) CGFloat springDamping;
@property (nonatomic, readonly) CGFloat initialVelocity;
@property (nonatomic, readonly) RCTAnimationType animationType;

@end

@implementation RCTAnimation

static UIViewAnimationOptions UIViewAnimationOptionsFromRCTAnimationType(RCTAnimationType type)
{
  switch (type) {
    case RCTAnimationTypeLinear:
      return UIViewAnimationOptionCurveLinear;
    case RCTAnimationTypeEaseIn:
      return UIViewAnimationOptionCurveEaseIn;
    case RCTAnimationTypeEaseOut:
      return UIViewAnimationOptionCurveEaseOut;
    case RCTAnimationTypeEaseInEaseOut:
      return UIViewAnimationOptionCurveEaseInOut;
    case RCTAnimationTypeKeyboard:
      // http://stackoverflow.com/questions/18870447/how-to-use-the-default-ios7-uianimation-curve
      return (UIViewAnimationOptions)(7 << 16);
    default:
      RCTLogError(@"Unsupported animation type %zd", type);
      return UIViewAnimationOptionCurveEaseInOut;
  }
}

- (instancetype)initWithDuration:(NSTimeInterval)duration dictionary:(NSDictionary *)config
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _property = [RCTConvert NSString:config[@"property"]];

    _duration = [RCTConvert NSTimeInterval:config[@"duration"]] ?: duration;
    if (_duration > 0.0 && _duration < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _duration = _duration * 1000.0;
    }

    _delay = [RCTConvert NSTimeInterval:config[@"delay"]];
    if (_delay > 0.0 && _delay < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      _delay = _delay * 1000.0;
    }

    _animationType = [RCTConvert RCTAnimationType:config[@"type"]];
    if (_animationType == RCTAnimationTypeSpring) {
      _springDamping = [RCTConvert CGFloat:config[@"springDamping"]];
      _initialVelocity = [RCTConvert CGFloat:config[@"initialVelocity"]];
    }
    _fromValue = config[@"fromValue"];
    _toValue = config[@"toValue"];
  }
  return self;
}

- (void)performAnimations:(void (^)(void))animations
      withCompletionBlock:(void (^)(BOOL completed))completionBlock
{
  if (_animationType == RCTAnimationTypeSpring) {

    [UIView animateWithDuration:_duration
                          delay:_delay
         usingSpringWithDamping:_springDamping
          initialSpringVelocity:_initialVelocity
                        options:UIViewAnimationOptionBeginFromCurrentState
                     animations:animations
                     completion:completionBlock];

  } else {

    UIViewAnimationOptions options = UIViewAnimationOptionBeginFromCurrentState |
      UIViewAnimationOptionsFromRCTAnimationType(_animationType);

    [UIView animateWithDuration:_duration
                          delay:_delay
                        options:options
                     animations:animations
                     completion:completionBlock];
  }
}

@end

@interface RCTLayoutAnimation : NSObject

@property (nonatomic, copy) NSDictionary *config;
@property (nonatomic, strong) RCTAnimation *createAnimation;
@property (nonatomic, strong) RCTAnimation *updateAnimation;
@property (nonatomic, strong) RCTAnimation *deleteAnimation;
@property (nonatomic, copy) RCTResponseSenderBlock callback;

@end

@implementation RCTLayoutAnimation

- (instancetype)initWithDictionary:(NSDictionary *)config callback:(RCTResponseSenderBlock)callback
{
  if (!config) {
    return nil;
  }

  if ((self = [super init])) {
    _config = [config copy];
    NSTimeInterval duration = [RCTConvert NSTimeInterval:config[@"duration"]];
    if (duration > 0.0 && duration < 0.01) {
      RCTLogError(@"RCTLayoutAnimation expects timings to be in ms, not seconds.");
      duration = duration * 1000.0;
    }

    _createAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"create"]];
    _updateAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"update"]];
    _deleteAnimation = [[RCTAnimation alloc] initWithDuration:duration dictionary:config[@"delete"]];
    _callback = callback;
  }
  return self;
}

@end

@interface RCTUIManager ()

// NOTE: these are properties so that they can be accessed by unit tests
@property (nonatomic, strong) RCTSparseArray *viewManagerRegistry; // RCT thread only
@property (nonatomic, strong) RCTSparseArray *shadowViewRegistry; // RCT thread only
@property (nonatomic, strong) RCTSparseArray *viewRegistry; // Main thread only

@end

@implementation RCTUIManager
{
  dispatch_queue_t _shadowQueue;

  // Root views are only mutated on the shadow queue
  NSMutableSet *_rootViewTags;
  NSMutableArray *_pendingUIBlocks;
  NSLock *_pendingUIBlocksLock;

  // Animation
  RCTLayoutAnimation *_nextLayoutAnimation; // RCT thread only
  RCTLayoutAnimation *_layoutAnimation; // Main thread only

  // Keyed by viewName
  NSMutableDictionary *_defaultShadowViews; // RCT thread only
  NSMutableDictionary *_defaultViews; // Main thread only
  NSDictionary *_viewManagers;
  NSDictionary *_viewConfigs;

  NSMutableSet *_bridgeTransactionListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

/**
 * Declared in RCTBridge.
 */
extern NSString *RCTBridgeModuleNameForClass(Class cls);

/**
 * This function derives the view name automatically
 * from the module name.
 */
static NSString *RCTViewNameForModuleName(NSString *moduleName)
{
  NSString *name = moduleName;
  RCTAssert(name.length, @"Invalid moduleName '%@'", moduleName);
  if ([name hasSuffix:@"Manager"]) {
    name = [name substringToIndex:name.length - @"Manager".length];
  }
  return name;
}

// TODO: only send name once instead of a dictionary of name and type keyed by name
static NSDictionary *RCTViewConfigForModule(Class managerClass)
{
  unsigned int count = 0;
  Method *methods = class_copyMethodList(object_getClass(managerClass), &count);
  NSMutableDictionary *props = [[NSMutableDictionary alloc] initWithCapacity:count];
  for (unsigned int i = 0; i < count; i++) {
    Method method = methods[i];
    NSString *methodName = NSStringFromSelector(method_getName(method));
    if ([methodName hasPrefix:@"getPropConfig"]) {
      NSRange nameRange = [methodName rangeOfString:@"_"];
      if (nameRange.length) {
        NSString *name = [methodName substringFromIndex:nameRange.location + 1];
        NSString *type = [managerClass valueForKey:methodName];
        props[name] = type;
      }
    }
  }
  free(methods);
  return props;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _shadowQueue = dispatch_queue_create("com.facebook.React.ShadowQueue", DISPATCH_QUEUE_SERIAL);

    _pendingUIBlocksLock = [[NSLock alloc] init];

    _defaultShadowViews = [[NSMutableDictionary alloc] init];
    _defaultViews = [[NSMutableDictionary alloc] init];

    _viewManagerRegistry = [[RCTSparseArray alloc] init];
    _shadowViewRegistry = [[RCTSparseArray alloc] init];
    _viewRegistry = [[RCTSparseArray alloc] init];

    // Internal resources
    _pendingUIBlocks = [[NSMutableArray alloc] init];
    _rootViewTags = [[NSMutableSet alloc] init];

    _bridgeTransactionListeners = [[NSMutableSet alloc] init];
  }
  return self;
}

- (BOOL)isValid
{
  return _viewRegistry != nil;
}

- (void)invalidate
{
  /**
   * Called on the JS Thread since all modules are invalidated on the JS thread
   */

  dispatch_async(dispatch_get_main_queue(), ^{
    for (NSNumber *rootViewTag in _rootViewTags) {
      [_viewRegistry[rootViewTag] invalidate];
    }

    _rootViewTags = nil;
    _shadowViewRegistry = nil;
    _viewRegistry = nil;
    _bridgeTransactionListeners = nil;
    _bridge = nil;

    [_pendingUIBlocksLock lock];
    _pendingUIBlocks = nil;
    [_pendingUIBlocksLock unlock];
  });
}

- (void)setBridge:(RCTBridge *)bridge
{
  RCTAssert(_bridge == nil, @"Should not re-use same UIIManager instance");

  _bridge = bridge;
  _shadowViewRegistry = [[RCTSparseArray alloc] init];

  // Get view managers from bridge
  NSMutableDictionary *viewManagers = [[NSMutableDictionary alloc] init];
  NSMutableDictionary *viewConfigs = [[NSMutableDictionary alloc] init];
  [_bridge.modules enumerateKeysAndObjectsUsingBlock:
   ^(NSString *moduleName, RCTViewManager *manager, __unused BOOL *stop) {
    if ([manager isKindOfClass:[RCTViewManager class]]) {
      NSString *viewName = RCTViewNameForModuleName(moduleName);
      viewManagers[viewName] = manager;
      viewConfigs[viewName] = RCTViewConfigForModule([manager class]);
    }
  }];

  _viewManagers = [viewManagers copy];
  _viewConfigs = [viewConfigs copy];
}

- (dispatch_queue_t)methodQueue
{
  return _shadowQueue;
}

- (void)registerRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag),
            @"View %@ with tag #%@ is not a root view", rootView, reactTag);

  UIView *existingView = _viewRegistry[reactTag];
  RCTAssert(existingView == nil || existingView == rootView,
            @"Expect all root views to have unique tag. Added %@ twice", reactTag);

  // Register view
  _viewRegistry[reactTag] = rootView;
  CGRect frame = rootView.frame;

  // Register shadow view
  __weak RCTUIManager *weakSelf = self;
  dispatch_async(_shadowQueue, ^{
    RCTUIManager *strongSelf = weakSelf;
    if (!strongSelf.isValid) {
      return;
    }
    RCTShadowView *shadowView = [[RCTShadowView alloc] init];
    shadowView.reactTag = reactTag;
    shadowView.frame = frame;
    shadowView.backgroundColor = rootView.backgroundColor;
    shadowView.viewName = NSStringFromClass([rootView class]);
    strongSelf->_shadowViewRegistry[shadowView.reactTag] = shadowView;
    [strongSelf->_rootViewTags addObject:reactTag];
  });
}

- (UIView *)viewForReactTag:(NSNumber *)reactTag
{
  RCTAssertMainThread();
  return _viewRegistry[reactTag];
}

- (void)setFrame:(CGRect)frame forRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag), @"Specified view %@ is not a root view", reactTag);

  dispatch_async(_shadowQueue, ^{
    RCTShadowView *rootShadowView = _shadowViewRegistry[reactTag];
    RCTAssert(rootShadowView != nil, @"Could not locate root view with tag #%@", reactTag);
    rootShadowView.frame = frame;
    [rootShadowView updateLayout];

    [self batchDidComplete];
  });
}

- (void)setBackgroundColor:(UIColor *)color forRootView:(UIView *)rootView
{
  RCTAssertMainThread();

  NSNumber *reactTag = rootView.reactTag;
  RCTAssert(RCTIsReactRootView(reactTag), @"Specified view %@ is not a root view", reactTag);

  __weak RCTUIManager *weakSelf = self;
  dispatch_async(_shadowQueue, ^{
    RCTUIManager *strongSelf = weakSelf;
    if (!strongSelf.isValid) {
      return;
    }
    RCTShadowView *rootShadowView = strongSelf->_shadowViewRegistry[reactTag];
    RCTAssert(rootShadowView != nil, @"Could not locate root view with tag #%@", reactTag);
    rootShadowView.backgroundColor = color;
    [self _amendPendingUIBlocksWithStylePropagationUpdateForRootView:rootShadowView];
    [self flushUIBlocks];
  });
}

/**
 * Unregisters views from registries
 */
- (void)_purgeChildren:(NSArray *)children fromRegistry:(RCTSparseArray *)registry
{
  for (id<RCTViewNodeProtocol> child in children) {
    RCTTraverseViewNodes(registry[child.reactTag], ^(id<RCTViewNodeProtocol> subview) {
      RCTAssert(![subview isReactRootView], @"Root views should not be unregistered");
      if ([subview conformsToProtocol:@protocol(RCTInvalidating)]) {
        [(id<RCTInvalidating>)subview invalidate];
      }
      registry[subview.reactTag] = nil;

      if (registry == _viewRegistry) {
        [_bridgeTransactionListeners removeObject:subview];
      }
    });
  }
}

- (void)addUIBlock:(RCTViewManagerUIBlock)block
{
  RCTAssertThread(_shadowQueue,
                  @"-[RCTUIManager addUIBlock:] should only be called from the "
                  "UIManager's _shadowQueue (it may be accessed via `bridge.uiManager.methodQueue`)");

  if (!block) {
    return;
  }

  if (!self.isValid) {
    return;
  }

  __weak RCTUIManager *weakViewManager = self;
  dispatch_block_t outerBlock = ^{
    RCTUIManager *strongViewManager = weakViewManager;
    if (strongViewManager && strongViewManager.isValid) {
      block(strongViewManager, strongViewManager->_viewRegistry);
    }
  };

  [_pendingUIBlocksLock lock];
  [_pendingUIBlocks addObject:outerBlock];
  [_pendingUIBlocksLock unlock];
}

- (RCTViewManagerUIBlock)uiBlockWithLayoutUpdateForRootView:(RCTShadowView *)rootShadowView
{
  RCTAssert(![NSThread isMainThread], @"Should be called on shadow thread");

  NSMutableSet *viewsWithNewFrames = [NSMutableSet setWithCapacity:1];

  // This is nuanced. In the JS thread, we create a new update buffer
  // `frameTags`/`frames` that is created/mutated in the JS thread. We access
  // these structures in the UI-thread block. `NSMutableArray` is not thread
  // safe so we rely on the fact that we never mutate it after it's passed to
  // the main thread.
  [rootShadowView collectRootUpdatedFrames:viewsWithNewFrames
                          parentConstraint:(CGSize){CSS_UNDEFINED, CSS_UNDEFINED}];

  // Parallel arrays are built and then handed off to main thread
  NSMutableArray *frameReactTags = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *frames = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *areNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *parentsAreNew = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];
  NSMutableArray *onLayoutEvents = [NSMutableArray arrayWithCapacity:viewsWithNewFrames.count];

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    [frameReactTags addObject:shadowView.reactTag];
    [frames addObject:[NSValue valueWithCGRect:shadowView.frame]];
    [areNew addObject:@(shadowView.isNewView)];
    [parentsAreNew addObject:@(shadowView.superview.isNewView)];
    id event = (id)kCFNull;
    if (shadowView.hasOnLayout) {
      event = @{
        @"target": shadowView.reactTag,
        @"layout": @{
          @"x": @(shadowView.frame.origin.x),
          @"y": @(shadowView.frame.origin.y),
          @"width": @(shadowView.frame.size.width),
          @"height": @(shadowView.frame.size.height),
        },
      };
    }
    [onLayoutEvents addObject:event];
  }

  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    // We have to do this after we build the parentsAreNew array.
    shadowView.newView = NO;
  }

  // These are blocks to be executed on each view, immediately after
  // reactSetFrame: has been called. Note that if reactSetFrame: is not called,
  // these won't be called either, so this is not a suitable place to update
  // properties that aren't related to layout.
  NSMutableArray *updateBlocks = [[NSMutableArray alloc] init];
  for (RCTShadowView *shadowView in viewsWithNewFrames) {
    RCTViewManager *manager = _viewManagerRegistry[shadowView.reactTag];
    RCTViewManagerUIBlock block = [manager uiBlockToAmendWithShadowView:shadowView];
    if (block) [updateBlocks addObject:block];
  }

  // Perform layout (possibly animated)
  return ^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTResponseSenderBlock callback = self->_layoutAnimation.callback;
    __block NSUInteger completionsCalled = 0;
    for (NSUInteger ii = 0; ii < frames.count; ii++) {
      NSNumber *reactTag = frameReactTags[ii];
      UIView *view = viewRegistry[reactTag];
      CGRect frame = [frames[ii] CGRectValue];
      id event = onLayoutEvents[ii];

      BOOL isNew = [areNew[ii] boolValue];
      RCTAnimation *updateAnimation = isNew ? nil : _layoutAnimation.updateAnimation;
      BOOL shouldAnimateCreation = isNew && ![parentsAreNew[ii] boolValue];
      RCTAnimation *createAnimation = shouldAnimateCreation ? _layoutAnimation.createAnimation : nil;

      void (^completion)(BOOL) = ^(BOOL finished) {
        completionsCalled++;
        if (event != (id)kCFNull) {
          [self.bridge.eventDispatcher sendInputEventWithName:@"topLayout" body:event];
        }
        if (callback && completionsCalled == frames.count - 1) {
          callback(@[@(finished)]);
        }
      };

      // Animate view update
      if (updateAnimation) {
        [updateAnimation performAnimations:^{
          [view reactSetFrame:frame];
          for (RCTViewManagerUIBlock block in updateBlocks) {
            block(self, _viewRegistry);
          }
        } withCompletionBlock:completion];
      } else {
        [view reactSetFrame:frame];
        for (RCTViewManagerUIBlock block in updateBlocks) {
          block(self, _viewRegistry);
        }
        completion(YES);
      }

      // Animate view creation
      if (createAnimation) {
        if ([createAnimation.property isEqualToString:@"scaleXY"]) {
          view.layer.transform = CATransform3DMakeScale(0, 0, 0);
        } else if ([createAnimation.property isEqualToString:@"opacity"]) {
          view.layer.opacity = 0.0;
        }
        [createAnimation performAnimations:^{
          if ([createAnimation.property isEqual:@"scaleXY"]) {
            view.layer.transform = CATransform3DIdentity;
          } else if ([createAnimation.property isEqual:@"opacity"]) {
            view.layer.opacity = 1.0;
          } else {
            RCTLogError(@"Unsupported layout animation createConfig property %@",
                        createAnimation.property);
          }
          for (RCTViewManagerUIBlock block in updateBlocks) {
            block(self, _viewRegistry);
          }
        } withCompletionBlock:nil];
      }
    }

    /**
     * TODO(tadeu): Remove it once and for all
     */
    for (id<RCTViewNodeProtocol> node in _bridgeTransactionListeners) {
      [node reactBridgeDidFinishTransaction];
    }
  };
}

- (void)_amendPendingUIBlocksWithStylePropagationUpdateForRootView:(RCTShadowView *)topView
{
  NSMutableSet *applierBlocks = [NSMutableSet setWithCapacity:1];
  [topView collectUpdatedProperties:applierBlocks parentProperties:@{}];

  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTApplierBlock block in applierBlocks) {
      block(viewRegistry);
    }
  }];
}

/**
 * A method to be called from JS, which takes a container ID and then releases
 * all subviews for that container upon receipt.
 */
RCT_EXPORT_METHOD(removeSubviewsFromContainerWithID:(NSNumber *)containerID)
{
  id<RCTViewNodeProtocol> container = _shadowViewRegistry[containerID];
  RCTAssert(container != nil, @"container view (for ID %@) not found", containerID);

  NSUInteger subviewsCount = [container reactSubviews].count;
  NSMutableArray *indices = [[NSMutableArray alloc] initWithCapacity:subviewsCount];
  for (NSUInteger childIndex = 0; childIndex < subviewsCount; childIndex++) {
    [indices addObject:@(childIndex)];
  }

  [self manageChildren:containerID
       moveFromIndices:nil
         moveToIndices:nil
     addChildReactTags:nil
          addAtIndices:nil
       removeAtIndices:indices];
}

/**
 * Disassociates children from container. Doesn't remove from registries.
 * TODO: use [NSArray getObjects:buffer] to reuse same fast buffer each time.
 *
 * @returns Array of removed items.
 */
- (NSArray *)_childrenToRemoveFromContainer:(id<RCTViewNodeProtocol>)container
                                  atIndices:(NSArray *)atIndices
{
  // If there are no indices to move or the container has no subviews don't bother
  // We support parents with nil subviews so long as they're all nil so this allows for this behavior
  if (atIndices.count == 0 || [container reactSubviews].count == 0) {
    return nil;
  }
  // Construction of removed children must be done "up front", before indices are disturbed by removals.
  NSMutableArray *removedChildren = [NSMutableArray arrayWithCapacity:atIndices.count];
  RCTAssert(container != nil, @"container view (for ID %@) not found", container);
  for (NSNumber *indexNumber in atIndices) {
    NSUInteger index = indexNumber.unsignedIntegerValue;
    if (index < [container reactSubviews].count) {
      [removedChildren addObject:[container reactSubviews][index]];
    }
  }
  if (removedChildren.count != atIndices.count) {
    RCTLogMustFix(@"removedChildren count (%tu) was not what we expected (%tu)",
                  removedChildren.count, atIndices.count);
  }
  return removedChildren;
}

- (void)_removeChildren:(NSArray *)children fromContainer:(id<RCTViewNodeProtocol>)container
{
  for (id removedChild in children) {
    [container removeReactSubview:removedChild];
  }
}

RCT_EXPORT_METHOD(removeRootView:(NSNumber *)rootReactTag)
{
  RCTShadowView *rootShadowView = _shadowViewRegistry[rootReactTag];
  RCTAssert(rootShadowView.superview == nil, @"root view cannot have superview (ID %@)", rootReactTag);
  [self _purgeChildren:rootShadowView.reactSubviews fromRegistry:_shadowViewRegistry];
   _shadowViewRegistry[rootReactTag] = nil;
  [_rootViewTags removeObject:rootReactTag];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTAssertMainThread();
    UIView *rootView = viewRegistry[rootReactTag];
    [uiManager _purgeChildren:rootView.reactSubviews fromRegistry:viewRegistry];
    viewRegistry[rootReactTag] = nil;
  }];
}

RCT_EXPORT_METHOD(replaceExistingNonRootView:(NSNumber *)reactTag withView:(NSNumber *)newReactTag)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTAssert(shadowView != nil, @"shadowView (for ID %@) not found", reactTag);

  RCTShadowView *superShadowView = shadowView.superview;
  RCTAssert(superShadowView != nil, @"shadowView super (of ID %@) not found", reactTag);

  NSUInteger indexOfView = [superShadowView.reactSubviews indexOfObject:shadowView];
  RCTAssert(indexOfView != NSNotFound, @"View's superview doesn't claim it as subview (id %@)", reactTag);
  NSArray *removeAtIndices = @[@(indexOfView)];
  NSArray *addTags = @[newReactTag];
  [self manageChildren:superShadowView.reactTag
        moveFromIndices:nil
          moveToIndices:nil
      addChildReactTags:addTags
          addAtIndices:removeAtIndices
        removeAtIndices:removeAtIndices];
}

RCT_EXPORT_METHOD(manageChildren:(NSNumber *)containerReactTag
                  moveFromIndices:(NSArray *)moveFromIndices
                  moveToIndices:(NSArray *)moveToIndices
                  addChildReactTags:(NSArray *)addChildReactTags
                  addAtIndices:(NSArray *)addAtIndices
                  removeAtIndices:(NSArray *)removeAtIndices)
{
  [self _manageChildren:containerReactTag
        moveFromIndices:moveFromIndices
          moveToIndices:moveToIndices
      addChildReactTags:addChildReactTags
           addAtIndices:addAtIndices
        removeAtIndices:removeAtIndices
               registry:_shadowViewRegistry];

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    [uiManager _manageChildren:containerReactTag
               moveFromIndices:moveFromIndices
                 moveToIndices:moveToIndices
             addChildReactTags:addChildReactTags
                  addAtIndices:addAtIndices
               removeAtIndices:removeAtIndices
                      registry:viewRegistry];
  }];
}

- (void)_manageChildren:(NSNumber *)containerReactTag
        moveFromIndices:(NSArray *)moveFromIndices
          moveToIndices:(NSArray *)moveToIndices
      addChildReactTags:(NSArray *)addChildReactTags
           addAtIndices:(NSArray *)addAtIndices
        removeAtIndices:(NSArray *)removeAtIndices
               registry:(RCTSparseArray *)registry
{
  id<RCTViewNodeProtocol> container = registry[containerReactTag];
  RCTAssert(moveFromIndices.count == moveToIndices.count, @"moveFromIndices had size %tu, moveToIndices had size %tu", moveFromIndices.count, moveToIndices.count);
  RCTAssert(addChildReactTags.count == addAtIndices.count, @"there should be at least one React child to add");

  // Removes (both permanent and temporary moves) are using "before" indices
  NSArray *permanentlyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:removeAtIndices];
  NSArray *temporarilyRemovedChildren = [self _childrenToRemoveFromContainer:container atIndices:moveFromIndices];
  [self _removeChildren:permanentlyRemovedChildren fromContainer:container];
  [self _removeChildren:temporarilyRemovedChildren fromContainer:container];

  [self _purgeChildren:permanentlyRemovedChildren fromRegistry:registry];

  // TODO (#5906496): optimize all these loops - constantly calling array.count is not efficient

  // Figure out what to insert - merge temporary inserts and adds
  NSMutableDictionary *destinationsToChildrenToAdd = [NSMutableDictionary dictionary];
  for (NSInteger index = 0, length = temporarilyRemovedChildren.count; index < length; index++) {
    destinationsToChildrenToAdd[moveToIndices[index]] = temporarilyRemovedChildren[index];
  }
  for (NSInteger index = 0, length = addAtIndices.count; index < length; index++) {
    id view = registry[addChildReactTags[index]];
    if (view) {
      destinationsToChildrenToAdd[addAtIndices[index]] = view;
    }
  }

  NSArray *sortedIndices = [[destinationsToChildrenToAdd allKeys] sortedArrayUsingSelector:@selector(compare:)];
  for (NSNumber *reactIndex in sortedIndices) {
    [container insertReactSubview:destinationsToChildrenToAdd[reactIndex] atIndex:reactIndex.integerValue];
  }
}

static BOOL RCTCallPropertySetter(NSString *key, SEL setter, id value, id view, id defaultView, RCTViewManager *manager)
{
  // TODO: cache respondsToSelector tests
  if ([manager respondsToSelector:setter]) {

    if (value == (id)kCFNull) {
      value = nil;
    }

    void (^block)() = ^{
      ((void (*)(id, SEL, id, id, id))objc_msgSend)(manager, setter, value, view, defaultView);
    };

    if (RCT_DEBUG) {
      NSString *viewName = RCTViewNameForModuleName(RCTBridgeModuleNameForClass([manager class]));
      NSString *logPrefix = [NSString stringWithFormat:
                             @"Error setting property '%@' of %@ with tag #%@: ",
                             key, viewName, [view reactTag]];

      RCTPerformBlockWithLogPrefix(block, logPrefix);
    } else {
      block();
    }

    return YES;
  }
  return NO;
}

static void RCTSetViewProps(NSDictionary *props, UIView *view,
                            UIView *defaultView, RCTViewManager *manager)
{
  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, __unused BOOL *stop) {

    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:forView:withDefaultView:", key]);
    RCTCallPropertySetter(key, setter, obj, view, defaultView, manager);

  }];
}

static void RCTSetShadowViewProps(NSDictionary *props, RCTShadowView *shadowView,
                                  RCTShadowView *defaultView, RCTViewManager *manager)
{
  [props enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, __unused BOOL *stop) {

    SEL setter = NSSelectorFromString([NSString stringWithFormat:@"set_%@:forShadowView:withDefaultView:", key]);
    RCTCallPropertySetter(key, setter, obj, shadowView, defaultView, manager);

  }];

  // Update layout
  [shadowView updateLayout];
}

RCT_EXPORT_METHOD(createView:(NSNumber *)reactTag
                  viewName:(NSString *)viewName
                  rootTag:(__unused NSNumber *)rootTag
                  props:(NSDictionary *)props)
{
  RCTViewManager *manager = _viewManagers[viewName];
  if (manager == nil) {
    RCTLogWarn(@"No manager class found for view with module name \"%@\"", viewName);
    manager = [[RCTViewManager alloc] init];
  }

  // Register manager
  _viewManagerRegistry[reactTag] = manager;

  RCTShadowView *shadowView = [manager shadowView];
  if (shadowView) {

    // Generate default view, used for resetting default props
    if (!_defaultShadowViews[viewName]) {
      _defaultShadowViews[viewName] = [manager shadowView];
    }

    // Set properties
    shadowView.viewName = viewName;
    shadowView.reactTag = reactTag;
    RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[viewName], manager);
  }
  _shadowViewRegistry[reactTag] = shadowView;

  // Shadow view is the source of truth for background color this is a little
  // bit counter-intuitive if people try to set background color when setting up
  // the view, but it's the only way that makes sense given our threading model
  UIColor *backgroundColor = shadowView.backgroundColor;

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    RCTAssertMainThread();

    UIView *view = [manager view];
    if (view) {

      // Generate default view, used for resetting default props
      if (!uiManager->_defaultViews[viewName]) {
        // Note the default is setup after the props are read for the first time
        // ever for this className - this is ok because we only use the default
        // for restoring defaults, which never happens on first creation.
        uiManager->_defaultViews[viewName] = [manager view];
      }

      // Set properties
      view.reactTag = reactTag;
      view.backgroundColor = backgroundColor;
      if ([view isKindOfClass:[UIView class]]) {
        view.multipleTouchEnabled = YES;
        view.userInteractionEnabled = YES; // required for touch handling
        view.layer.allowsGroupOpacity = YES; // required for touch handling
      }
      RCTSetViewProps(props, view, uiManager->_defaultViews[viewName], manager);

      if ([view respondsToSelector:@selector(reactBridgeDidFinishTransaction)]) {
        [uiManager->_bridgeTransactionListeners addObject:view];
      }
    }
    viewRegistry[reactTag] = view;
  }];
}

// TODO: remove viewName param as it isn't needed
RCT_EXPORT_METHOD(updateView:(NSNumber *)reactTag
                  viewName:(__unused NSString *)_
                  props:(NSDictionary *)props)
{
  RCTViewManager *viewManager = _viewManagerRegistry[reactTag];
  NSString *viewName = RCTViewNameForModuleName(RCTBridgeModuleNameForClass([viewManager class]));

  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTSetShadowViewProps(props, shadowView, _defaultShadowViews[viewName], viewManager);

  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    RCTSetViewProps(props, view, uiManager->_defaultViews[viewName], viewManager);
  }];
}

RCT_EXPORT_METHOD(focus:(NSNumber *)reactTag)
{
  if (!reactTag) return;
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *newResponder = viewRegistry[reactTag];
    [newResponder reactWillMakeFirstResponder];
    [newResponder becomeFirstResponder];
    [newResponder reactDidMakeFirstResponder];
  }];
}

RCT_EXPORT_METHOD(blur:(NSNumber *)reactTag)
{
  if (!reactTag) return;
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *currentResponder = viewRegistry[reactTag];
    [currentResponder resignFirstResponder];
  }];
}

RCT_EXPORT_METHOD(findSubviewIn:(NSNumber *)reactTag atPoint:(CGPoint)point callback:(RCTResponseSenderBlock)callback) {
  if (!reactTag) {
    callback(@[(id)kCFNull]);
    return;
  }

  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    UIView *target = [view hitTest:point withEvent:nil];
    CGRect frame = [target convertRect:target.bounds toView:view];

    while (target.reactTag == nil && target.superview != nil) {
      target = [target superview];
    }

    callback(@[
      RCTNullIfNil(target.reactTag),
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
    ]);
  }];
}

- (void)batchDidComplete
{
  RCTProfileBeginEvent();
  // Gather blocks to be executed now that all view hierarchy manipulations have
  // been completed (note that these may still take place before layout has finished)
  for (RCTViewManager *manager in _viewManagers.allValues) {
    RCTViewManagerUIBlock uiBlock = [manager uiBlockToAmendWithShadowViewRegistry:_shadowViewRegistry];
    [self addUIBlock:uiBlock];
  }

  // Set up next layout animation
  if (_nextLayoutAnimation) {
    RCTLayoutAnimation *layoutAnimation = _nextLayoutAnimation;
    [self addUIBlock:^(RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
      uiManager->_layoutAnimation = layoutAnimation;
    }];
  }

  // Perform layout
  for (NSNumber *reactTag in _rootViewTags) {
    RCTShadowView *rootView = _shadowViewRegistry[reactTag];
    [self addUIBlock:[self uiBlockWithLayoutUpdateForRootView:rootView]];
    [self _amendPendingUIBlocksWithStylePropagationUpdateForRootView:rootView];
  }

  // Clear layout animations
  if (_nextLayoutAnimation) {
    [self addUIBlock:^(RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
      uiManager->_layoutAnimation = nil;
    }];
    _nextLayoutAnimation = nil;
  }

  RCTProfileEndEvent(@"[RCTUIManager batchDidComplete]", @"uimanager", @{
    @"view_count": @([_viewRegistry count]),
  });
  [self flushUIBlocks];
}

- (void)flushUIBlocks
{
  // First copy the previous blocks into a temporary variable, then reset the
  // pending blocks to a new array. This guards against mutation while
  // processing the pending blocks in another thread.
  [_pendingUIBlocksLock lock];
  NSArray *previousPendingUIBlocks = _pendingUIBlocks;
  _pendingUIBlocks = [[NSMutableArray alloc] init];
  [_pendingUIBlocksLock unlock];

  // Execute the previously queued UI blocks
  RCTProfileBeginFlowEvent();
  dispatch_async(dispatch_get_main_queue(), ^{
    RCTProfileEndFlowEvent();
    RCTProfileBeginEvent();
    for (dispatch_block_t block in previousPendingUIBlocks) {
      block();
    }
    RCTProfileEndEvent(@"UIManager flushUIBlocks", @"objc_call", @{
      @"count": @(previousPendingUIBlocks.count),
    });
  });
}

RCT_EXPORT_METHOD(measure:(NSNumber *)reactTag
                  callback:(RCTResponseSenderBlock)callback)
{
  if (!callback) {
    RCTLogError(@"Called measure with no callback");
    return;
  }

  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogError(@"measure cannot find view with tag #%@", reactTag);
      return;
    }
    CGRect frame = view.frame;

    UIView *rootView = view;
    while (rootView && ![rootView isReactRootView]) {
      rootView = rootView.superview;
    }

    // TODO: this doesn't work because sometimes view is inside a modal window
    // RCTAssert([rootView isReactRootView], @"React view is not inside a React root view");

    // By convention, all coordinates, whether they be touch coordinates, or
    // measurement coordinates are with respect to the root view.
    CGPoint pagePoint = [view.superview convertPoint:frame.origin toView:rootView];

    callback(@[
      @(frame.origin.x),
      @(frame.origin.y),
      @(frame.size.width),
      @(frame.size.height),
      @(pagePoint.x),
      @(pagePoint.y)
    ]);
  }];
}

static void RCTMeasureLayout(RCTShadowView *view,
                             RCTShadowView *ancestor,
                             RCTResponseSenderBlock callback)
{
  if (!view) {
    return;
  }
  if (!ancestor) {
    return;
  }
  CGRect result = [view measureLayoutRelativeToAncestor:ancestor];
  if (CGRectIsNull(result)) {
    RCTLogError(@"view %@ (tag #%@) is not a decendant of %@ (tag #%@)",
                view, view.reactTag, ancestor, ancestor.reactTag);
    return;
  }
  CGFloat leftOffset = result.origin.x;
  CGFloat topOffset = result.origin.y;
  CGFloat width = result.size.width;
  CGFloat height = result.size.height;
  if (isnan(leftOffset) || isnan(topOffset) || isnan(width) || isnan(height)) {
    RCTLogError(@"Attempted to measure layout but offset or dimensions were NaN");
    return;
  }
  callback(@[@(leftOffset), @(topOffset), @(width), @(height)]);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
RCT_EXPORT_METHOD(measureLayout:(NSNumber *)reactTag
                  relativeTo:(NSNumber *)ancestorReactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTShadowView *ancestorShadowView = _shadowViewRegistry[ancestorReactTag];
  RCTMeasureLayout(shadowView, ancestorShadowView, callback);
}

/**
 * Returns the computed recursive offset layout in a dictionary form. The
 * returned values are relative to the `ancestor` shadow view. Returns `nil`, if
 * the `ancestor` shadow view is not actually an `ancestor`. Does not touch
 * anything on the main UI thread. Invokes supplied callback with (x, y, width,
 * height).
 */
RCT_EXPORT_METHOD(measureLayoutRelativeToParent:(NSNumber *)reactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  RCTMeasureLayout(shadowView, shadowView.reactSuperview, callback);
}

/**
 * Returns an array of computed offset layouts in a dictionary form. The layouts are of any React subviews
 * that are immediate descendants to the parent view found within a specified rect. The dictionary result
 * contains left, top, width, height and an index. The index specifies the position among the other subviews.
 * Only layouts for views that are within the rect passed in are returned. Invokes the error callback if the
 * passed in parent view does not exist. Invokes the supplied callback with the array of computed layouts.
 */
RCT_EXPORT_METHOD(measureViewsInRect:(CGRect)rect
                  parentView:(NSNumber *)reactTag
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback
                  callback:(RCTResponseSenderBlock)callback)
{
  RCTShadowView *shadowView = _shadowViewRegistry[reactTag];
  if (!shadowView) {
    RCTLogError(@"Attempting to measure view that does not exist (tag #%@)", reactTag);
    return;
  }
  NSArray *childShadowViews = [shadowView reactSubviews];
  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:[childShadowViews count]];


  [childShadowViews enumerateObjectsUsingBlock:
   ^(RCTShadowView *childShadowView, NSUInteger idx, __unused BOOL *stop) {
    CGRect childLayout = [childShadowView measureLayoutRelativeToAncestor:shadowView];
    if (CGRectIsNull(childLayout)) {
      RCTLogError(@"View %@ (tag #%@) is not a decendant of %@ (tag #%@)",
                  childShadowView, childShadowView.reactTag, shadowView, shadowView.reactTag);
      return;
    }

    CGFloat leftOffset = childLayout.origin.x;
    CGFloat topOffset = childLayout.origin.y;
    CGFloat width = childLayout.size.width;
    CGFloat height = childLayout.size.height;

    if (leftOffset <= rect.origin.x + rect.size.width &&
        leftOffset + width >= rect.origin.x &&
        topOffset <= rect.origin.y + rect.size.height &&
        topOffset + height >= rect.origin.y) {

      // This view is within the layout rect
      NSDictionary *result = @{@"index": @(idx),
                               @"left": @(leftOffset),
                               @"top": @(topOffset),
                               @"width": @(width),
                               @"height": @(height)};

      [results addObject:result];
    }
  }];
  callback(@[results]);
}

RCT_EXPORT_METHOD(setMainScrollViewTag:(NSNumber *)reactTag)
{
  [self addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    // - There should be at most one designated "main scroll view"
    // - There should be at most one designated "`nativeMainScrollDelegate`"
    // - The one designated main scroll view should have the one designated
    // `nativeMainScrollDelegate` set as its `nativeMainScrollDelegate`.
    if (uiManager.mainScrollView) {
      uiManager.mainScrollView.nativeMainScrollDelegate = nil;
    }
    if (reactTag) {
      id view = viewRegistry[reactTag];
      if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
        uiManager.mainScrollView = (id<RCTScrollableProtocol>)view;
        uiManager.mainScrollView.nativeMainScrollDelegate = uiManager.nativeMainScrollDelegate;
      } else {
        RCTAssert(NO, @"Tag #%@ does not conform to RCTScrollableProtocol", reactTag);
      }
    } else {
      uiManager.mainScrollView = nil;
    }
  }];
}

// TODO: we could just pass point property
RCT_EXPORT_METHOD(scrollTo:(NSNumber *)reactTag
                  withOffsetX:(CGFloat)offsetX
                  offsetY:(CGFloat)offsetY)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view scrollToOffset:(CGPoint){offsetX, offsetY} animated:YES];
    } else {
      RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
    }
  }];
}

// TODO: we could just pass point property
RCT_EXPORT_METHOD(scrollWithoutAnimationTo:(NSNumber *)reactTag
                  offsetX:(CGFloat)offsetX
                  offsetY:(CGFloat)offsetY)
{
    [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
            [(id<RCTScrollableProtocol>)view scrollToOffset:(CGPoint){offsetX, offsetY} animated:NO];
        } else {
            RCTLogError(@"tried to scrollToOffset: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
        }
    }];
}

RCT_EXPORT_METHOD(zoomToRect:(NSNumber *)reactTag
                  withRect:(CGRect)rect)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry){
    UIView *view = viewRegistry[reactTag];
    if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
      [(id<RCTScrollableProtocol>)view zoomToRect:rect animated:YES];
    } else {
      RCTLogError(@"tried to zoomToRect: on non-RCTScrollableProtocol view %@ with tag #%@", view, reactTag);
    }
  }];
}

/**
 * JS sets what *it* considers to be the responder. Later, scroll views can use
 * this in order to determine if scrolling is appropriate.
 */
RCT_EXPORT_METHOD(setJSResponder:(NSNumber *)reactTag
                  blockNativeResponder:(__unused BOOL)blockNativeResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    _jsResponder = viewRegistry[reactTag];
    if (!_jsResponder) {
      RCTLogError(@"Invalid view set to be the JS responder - tag %zd", reactTag);
    }
  }];
}

RCT_EXPORT_METHOD(clearJSResponder)
{
  [self addUIBlock:^(__unused RCTUIManager *uiManager, __unused RCTSparseArray *viewRegistry) {
    _jsResponder = nil;
  }];
}

// TODO: these event types should be distributed among the modules
// that declare them. Also, events should be registerable by any class
// that can call event handlers, not just UIViewManagers. This code
// also seems highly redundant - every event has the same properties.
- (NSDictionary *)customBubblingEventTypes
{
  NSMutableDictionary *customBubblingEventTypesConfigs = [@{
    // Bubble dispatched events
    @"topTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onPress",
        @"captured": @"onPressCapture"
      }
    },
    @"topVisibleCellsChange": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onVisibleCellsChange",
        @"captured": @"onVisibleCellsChangeCapture"
      }
    },
    @"topNavigateBack": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onNavigationComplete",
        @"captured": @"onNavigationCompleteCapture"
      }
    },
    @"topNavLeftButtonTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onNavLeftButtonTap",
        @"captured": @"onNavLefttButtonTapCapture"
      }
    },
    @"topNavRightButtonTap": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onNavRightButtonTap",
        @"captured": @"onNavRightButtonTapCapture"
      }
    },
    @"topChange": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onChange",
        @"captured": @"onChangeCapture"
      }
    },
    @"topFocus": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onFocus",
        @"captured": @"onFocusCapture"
      }
    },
    @"topBlur": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onBlur",
        @"captured": @"onBlurCapture"
      }
    },
    @"topSubmitEditing": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onSubmitEditing",
        @"captured": @"onSubmitEditingCapture"
      }
    },
    @"topEndEditing": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onEndEditing",
        @"captured": @"onEndEditingCapture"
      }
    },
    @"topTextInput": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTextInput",
        @"captured": @"onTextInputCapture"
      }
    },
    @"topTouchStart": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchStart",
        @"captured": @"onTouchStartCapture"
      }
    },
    @"topTouchMove": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchMove",
        @"captured": @"onTouchMoveCapture"
      }
    },
    @"topTouchCancel": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchCancel",
        @"captured": @"onTouchCancelCapture"
      }
    },
    @"topTouchEnd": @{
      @"phasedRegistrationNames": @{
        @"bubbled": @"onTouchEnd",
        @"captured": @"onTouchEndCapture"
      }
    },
  } mutableCopy];

  for (RCTViewManager *manager in _viewManagers.allValues) {
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customBubblingEventTypes))) {
      NSDictionary *eventTypes = [manager customBubblingEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTAssert(!customBubblingEventTypesConfigs[eventName],
                  @"Event '%@' registered multiple times.", eventName);
      }
      [customBubblingEventTypesConfigs addEntriesFromDictionary:eventTypes];
    }
  };

  return customBubblingEventTypesConfigs;
}

- (NSDictionary *)customDirectEventTypes
{
  NSMutableDictionary *customDirectEventTypes = [@{
    @"topScrollBeginDrag": @{
      @"registrationName": @"onScrollBeginDrag"
    },
    @"topScroll": @{
      @"registrationName": @"onScroll"
    },
    @"topScrollEndDrag": @{
      @"registrationName": @"onScrollEndDrag"
    },
    @"topScrollAnimationEnd": @{
      @"registrationName": @"onScrollAnimationEnd"
    },
    @"topLayout": @{
      @"registrationName": @"onLayout"
    },
    @"topSelectionChange": @{
      @"registrationName": @"onSelectionChange"
    },
    @"topMomentumScrollBegin": @{
      @"registrationName": @"onMomentumScrollBegin"
    },
    @"topMomentumScrollEnd": @{
      @"registrationName": @"onMomentumScrollEnd"
    },
    @"topPullToRefresh": @{
      @"registrationName": @"onPullToRefresh"
    },
    @"topLoadingStart": @{
      @"registrationName": @"onLoadingStart"
    },
    @"topLoadingFinish": @{
      @"registrationName": @"onLoadingFinish"
    },
    @"topLoadingError": @{
      @"registrationName": @"onLoadingError"
    },
    @"topAccessibilityTap": @{
      @"registrationName": @"onAccessibilityTap"
    },
    @"topMagicTap": @{
      @"registrationName": @"onMagicTap"
    },
  } mutableCopy];

  for (RCTViewManager *manager in _viewManagers.allValues) {
    if (RCTClassOverridesInstanceMethod([manager class], @selector(customDirectEventTypes))) {
      NSDictionary *eventTypes = [manager customDirectEventTypes];
      for (NSString *eventName in eventTypes) {
        RCTAssert(!customDirectEventTypes[eventName], @"Event '%@' registered multiple times.", eventName);
      }
      [customDirectEventTypes addEntriesFromDictionary:eventTypes];
    }
  };

  return customDirectEventTypes;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary *allJSConstants = [@{
    @"customBubblingEventTypes": [self customBubblingEventTypes],
    @"customDirectEventTypes": [self customDirectEventTypes],
    @"Dimensions": @{
      @"window": @{
        @"width": @(RCTScreenSize().width),
        @"height": @(RCTScreenSize().height),
        @"scale": @(RCTScreenScale()),
      },
      @"modalFullscreenView": @{
        @"width": @(RCTScreenSize().width),
        @"height": @(RCTScreenSize().height),
      },
    },
  } mutableCopy];

  [_viewManagers enumerateKeysAndObjectsUsingBlock:
   ^(NSString *name, RCTViewManager *manager, __unused BOOL *stop) {

    NSMutableDictionary *constantsNamespace =
     [NSMutableDictionary dictionaryWithDictionary:allJSConstants[name]];

    // Add custom constants
    // TODO: should these be inherited?
    NSDictionary *constants = RCTClassOverridesInstanceMethod([manager class], @selector(constantsToExport)) ? [manager constantsToExport] : nil;
    if (constants.count) {
      RCTAssert(constantsNamespace[@"Constants"] == nil , @"Cannot redefine Constants in namespace: %@", name);
      // add an additional 'Constants' namespace for each class
      constantsNamespace[@"Constants"] = constants;
    }

    // Add native props
    constantsNamespace[@"NativeProps"] = _viewConfigs[name];

    allJSConstants[name] = [constantsNamespace copy];
  }];
  return allJSConstants;
}

RCT_EXPORT_METHOD(configureNextLayoutAnimation:(NSDictionary *)config
                  withCallback:(RCTResponseSenderBlock)callback
                  errorCallback:(__unused RCTResponseSenderBlock)errorCallback)
{
  if (_nextLayoutAnimation && ![config isEqualToDictionary:_nextLayoutAnimation.config]) {
    RCTLogWarn(@"Warning: Overriding previous layout animation with new one before the first began:\n%@ -> %@.", _nextLayoutAnimation.config, config);
  }
  if (config[@"delete"] != nil) {
    RCTLogError(@"LayoutAnimation only supports create and update right now. Config: %@", config);
  }
  _nextLayoutAnimation = [[RCTLayoutAnimation alloc] initWithDictionary:config
                                                               callback:callback];
}

static UIView *_jsResponder;

+ (UIView *)JSResponder
{
  return _jsResponder;
}

@end

@implementation RCTBridge (RCTUIManager)

- (RCTUIManager *)uiManager
{
  return self.modules[RCTBridgeModuleNameForClass([RCTUIManager class])];
}

@end
