/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPropsAnimatedNode.h"
#import "RCTAnimation.h"

@implementation RCTPropsAnimatedNode {
  RCTStyleAnimatedNode *_parentNode;
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent {
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[RCTStyleAnimatedNode class]]) {
    _parentNode = (RCTStyleAnimatedNode *)parent;
  }
  
}

- (void)onDettachedFromNode:(RCTAnimatedNode *)parent {
  [super onDettachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)connectToView:(NSNumber *)viewTag {
  _propertyMapper = [[RCTViewPropertyMapper alloc] initWithViewTag:viewTag];
}

- (void)disconnectFromView:(NSNumber *)viewTag {
  _propertyMapper = nil;
}

- (void)performUpdate {
  [super performUpdate];
  [self performViewUpdatesIfNecessary];
}

- (void)performViewUpdatesIfNecessary {
  NSDictionary *updates = [_parentNode updatedPropsDictionary];
  if (updates.count) {
    [self.propertyMapper updateViewWithDictionary:updates];
  }
}

@end
