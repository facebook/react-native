//
//  RCTPointAnnotation.h
//  React
//
//  Created by David Mohl on 5/12/15.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import <MapKit/MapKit.h>

@interface RCTPointAnnotation : MKPointAnnotation <MKAnnotation>

@property NSString *identifier;
@property BOOL hasLeftCallout;
@property BOOL hasRightCallout;
@property BOOL animateDrop;

@end
