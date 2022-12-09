/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTConvert+Modal.h"

@implementation RCTConvert (Modal)

+ (UISheetPresentationControllerDetent *)UISheetPresentationControllerDetent:(id)json {
  if (@available(iOS 16.0, *)) {
    if ([json isKindOfClass:[NSNumber class]]) {
      float value = [json floatValue];
      return [UISheetPresentationControllerDetent
              customDetentWithIdentifier:nil
              resolver:^CGFloat(id context) {
        return value;
      }];
    }
  }

  if ([json isEqualToString:@"medium"]) {
    return [UISheetPresentationControllerDetent mediumDetent];
  }

  return [UISheetPresentationControllerDetent largeDetent];
}

RCT_ARRAY_CONVERTER(UISheetPresentationControllerDetent)

@end
