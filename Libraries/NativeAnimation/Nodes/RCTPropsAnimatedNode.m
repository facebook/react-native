/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPropsAnimatedNode.h>

#import <React/RCTAnimationUtils.h>
#import <React/RCTColorAnimatedNode.h>
#import <React/RCTLog.h>
#import <React/RCTStyleAnimatedNode.h>
#import <React/RCTUIManager.h>
#import <React/RCTValueAnimatedNode.h>

@implementation RCTPropsAnimatedNode {
  NSNumber *_connectedViewTag;
  NSString *_connectedViewName;
  __weak RCTBridge *_bridge;
  __weak id<RCTSurfacePresenterStub> _surfacePresenter;
  NSMutableDictionary<NSString *, NSObject *> *_propsDictionary; // TODO: use RawProps or folly::dynamic directly
  BOOL _managedByFabric;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if (self = [super initWithTag:tag config:config]) {
    _propsDictionary = [NSMutableDictionary new];
  }
  return self;
}

- (BOOL)isManagedByFabric
{
  return _managedByFabric;
}

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
               bridge:(RCTBridge *)bridge
     surfacePresenter:(id<RCTSurfacePresenterStub>)surfacePresenter
{
  _bridge = bridge;
  _surfacePresenter = surfacePresenter;
  _connectedViewTag = viewTag;
  _connectedViewName = viewName;
  _managedByFabric = RCTUIManagerTypeForTagIsFabric(viewTag);
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _bridge = nil;
  _surfacePresenter = nil;
  _connectedViewTag = nil;
  _connectedViewName = nil;
  _managedByFabric = NO;
}

- (void)updateView
{
  if (_managedByFabric) {
    if (_bridge.surfacePresenter) {
      [_bridge.surfacePresenter synchronouslyUpdateViewOnUIThread:_connectedViewTag props:_propsDictionary];
    } else {
      [_surfacePresenter synchronouslyUpdateViewOnUIThread:_connectedViewTag props:_propsDictionary];
    }
  } else {
    [_bridge.uiManager synchronouslyUpdateViewOnUIThread:_connectedViewTag
                                                viewName:_connectedViewName
                                                   props:_propsDictionary];
  }
}

- (void)restoreDefaultValues
{
  if (_managedByFabric) {
    // Restoring to default values causes render of inconsistent state
    // to the user because it isn't synchonised with Fabric's UIManager.
    return;
  }
  // Restore the default value for all props that were modified by this node.
  for (NSString *key in _propsDictionary.allKeys) {
    _propsDictionary[key] = [NSNull null];
  }

  if (_propsDictionary.count) {
    [self updateView];
  }
}

- (NSString *)propertyNameForParentTag:(NSNumber *)parentTag
{
  __block NSString *propertyName;
  [self.config[@"props"]
      enumerateKeysAndObjectsUsingBlock:^(NSString *_Nonnull property, NSNumber *_Nonnull tag, BOOL *_Nonnull stop) {
        if ([tag isEqualToNumber:parentTag]) {
          propertyName = property;
          *stop = YES;
        }
      }];
  return propertyName;
}

- (void)performUpdate
{
  [super performUpdate];

  // Since we are updating nodes after detaching them from views there is a time where it's
  // possible that the view was disconnected and still receive an update, this is normal and we can
  // simply skip that update.
  if (!_connectedViewTag) {
    return;
  }

  for (NSNumber *parentTag in self.parentNodes.keyEnumerator) {
    RCTAnimatedNode *parentNode = [self.parentNodes objectForKey:parentTag];
    if ([parentNode isKindOfClass:[RCTStyleAnimatedNode class]]) {
      RCTStyleAnimatedNode *styleAnimatedNode = (RCTStyleAnimatedNode *)parentNode;
      [_propsDictionary addEntriesFromDictionary:styleAnimatedNode.propsDictionary];
    } else if ([parentNode isKindOfClass:[RCTValueAnimatedNode class]]) {
      RCTValueAnimatedNode *valueAnimatedNode = (RCTValueAnimatedNode *)parentNode;
      NSString *property = [self propertyNameForParentTag:parentTag];
      id animatedObject = valueAnimatedNode.animatedObject;
      if (animatedObject) {
        _propsDictionary[property] = animatedObject;
      } else {
        _propsDictionary[property] = @(valueAnimatedNode.value);
      }
    } else if ([parentNode isKindOfClass:[RCTColorAnimatedNode class]]) {
      RCTColorAnimatedNode *colorAnimatedNode = (RCTColorAnimatedNode *)parentNode;
      NSString *property = [self propertyNameForParentTag:parentTag];
      _propsDictionary[property] = @(colorAnimatedNode.color);
    }
  }

  if (_propsDictionary.count) {
    [self updateView];
  }
}

@end
