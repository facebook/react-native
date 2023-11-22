/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTraceUpdateOverlay.h"

#import <React/RCTLog.h>

@implementation RCTTraceUpdateOverlay

- (void)draw:(NSString *)serializedNodes
{
  NSArray *subViewsToRemove = [self subviews];
  for (UIView *v in subViewsToRemove) {
    [v removeFromSuperview];
  }

  NSData *serializedNodesAsData = [serializedNodes dataUsingEncoding:NSUTF8StringEncoding];

  NSError *error = nil;
  id deserializedNodes = [NSJSONSerialization JSONObjectWithData:serializedNodesAsData options:0 error:&error];

  if (error) {
    RCTLogError(@"Failed to parse serialized nodes passed to RCTTraceUpdatesOverlay");
    return;
  }

  if (![deserializedNodes isKindOfClass:[NSArray class]]) {
    RCTLogError(@"Expected to receive nodes as an array, got %@", NSStringFromClass([deserializedNodes class]));
    return;
  }

  NSArray *nodes = deserializedNodes;
  for (NSDictionary *node in nodes) {
    NSDictionary *nodeRectangle = node[@"rect"];
    NSNumber *nodeColor = node[@"color"];

    unsigned int nodeColorRGBValue = [nodeColor unsignedIntValue];

    NSNumber *x = nodeRectangle[@"left"];
    NSNumber *y = nodeRectangle[@"top"];
    NSNumber *width = nodeRectangle[@"width"];
    NSNumber *height = nodeRectangle[@"height"];

    CGRect rect = CGRectMake(x.doubleValue, y.doubleValue, width.doubleValue, height.doubleValue);

    UIView *box = [[UIView alloc] initWithFrame:rect];
    box.backgroundColor = [UIColor clearColor];

    box.layer.borderWidth = 2.0f;
    box.layer.borderColor = [UIColor colorWithRed:((nodeColorRGBValue & 0xFF0000) >> 16) / 255.0
                                            green:((nodeColorRGBValue & 0xFF00) >> 8) / 255.0
                                             blue:(nodeColorRGBValue & 0xFF) / 255.0
                                            alpha:1.0]
                                .CGColor;

    [self addSubview:box];
  }
}

@end
