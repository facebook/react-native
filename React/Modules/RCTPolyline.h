//
//  RCTPolyline.h
//  React
//
//  Created by Timothy Park on 11/7/15.
//  Copyright © 2015 Facebook. All rights reserved.
//

#ifndef RCTPolyline_h
#define RCTPolyline_h

#import <MapKit/MapKit.h>

@interface RCTPolyline : MKPolyline <MKAnnotation>

@property (nonatomic, copy) NSString *identifier;
@property (nonatomic, copy) UIColor* strokeColor;
@property (nonatomic, assign) double lineWidth;
@property (nonatomic, assign) double alpha;

@end

#endif /* RCTPolyline_h */
