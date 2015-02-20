// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

// TODO (#5906496): is there a reason for this protocol? It seems to be
// used in a number of places where it isn't really required - only the
// RCTBridge actually ever calls casts to it - in all other
// cases it is simply a way of adding some method definitions to classes

@protocol RCTInvalidating <NSObject>

@property (nonatomic, assign, readonly, getter = isValid) BOOL valid;

- (void)invalidate;

@end
