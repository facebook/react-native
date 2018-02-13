/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTFabricUIManager.h"

// This file contains experimental placeholders, nothing is finalized.
@implementation RCTFabricUIManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, createNode:(int)reactTag
                                                  viewName:(NSString *)viewName
                                                   rootTag:(int)rootTag
                                                     props:(NSDictionary *)props
                                            instanceHandle:(int)instanceHandleID)
{
  return @0;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, cloneNode:(int)nodeID)
{
  return @0;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, cloneNodeWithNewChildren:(int)nodeID)
{
  return @0;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, cloneNodeWithNewProps:(int)nodeID newProps:(NSDictionary *)newProps)
{
  return @0;
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, cloneNodeWithNewChildrenAndProps:(int)nodeID newProps:(NSDictionary *)newProps)
{
  return @0;
}

RCT_EXPORT_METHOD(appendChild:(int)parentNodeID child:(int)childNodeID)
{

}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, createChildSet)
{
  return @0;
}

RCT_EXPORT_METHOD(appendChildToSet:(int)childSetID child:(int)childNodeID)
{
}

RCT_EXPORT_METHOD(completeRoot:(int)rootTag childSet:(int)childSetID)
{
}

@end
