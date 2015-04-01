/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDimensionManager.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

static NSDictionary *RCTCurrentDimensions()
{
    static NSDictionary *dimensions;
    dimensions = @{
        @"width": [NSNumber numberWithFloat:[UIScreen mainScreen].applicationFrame.size.width],
        @"height": [NSNumber numberWithFloat:[UIScreen mainScreen].applicationFrame.size.height]
    };
    
    return dimensions;
}

@implementation RCTDimensionManager
{
    NSDictionary *_lastKnownDimensions;
}

@synthesize bridge = _bridge;

#pragma mark - Lifecycle

- (instancetype)init
{
    if ((self = [super init])) {
        _lastKnownDimensions = RCTCurrentDimensions();
        
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(deviceOrientationDidChangeNotification:)
                                                     name:UIDeviceOrientationDidChangeNotification
                                                   object:nil];
    }
    
    return self;
}

- (NSDictionary *)constantsToExport
{
    return @{ @"dimensions": _lastKnownDimensions};
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Notification methods

- (void)deviceOrientationDidChangeNotification:(NSNotification*)note
{
    _lastKnownDimensions = RCTCurrentDimensions();
    [_bridge.eventDispatcher sendDeviceEventWithName:@"dimensionsDidChange" body:_lastKnownDimensions];
}

@end
