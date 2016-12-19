/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>

@interface RCTMapAnnotation : MKPointAnnotation <MKAnnotation>

@property (nonatomic, copy) NSString *identifier;
@property (nonatomic, assign) BOOL hasLeftCallout;
@property (nonatomic, assign) BOOL hasRightCallout;
@property (nonatomic, assign) BOOL animateDrop;
@property (nonatomic, strong) UIColor *tintColor;
@property (nonatomic, strong) UIImage *image;
@property (nonatomic, assign) NSUInteger viewIndex;
@property (nonatomic, assign) NSUInteger leftCalloutViewIndex;
@property (nonatomic, assign) NSUInteger rightCalloutViewIndex;
@property (nonatomic, assign) NSUInteger detailCalloutViewIndex;
@property (nonatomic, assign) BOOL draggable;

@end
