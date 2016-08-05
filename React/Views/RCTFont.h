/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTConvert.h"

@interface RCTFont : NSObject

/**
 * Update a font with a given font-family, size, weight and style.
 * If parameters are not specified, they'll be kept as-is.
 * If font is nil, the default system font of size 14 will be used.
 */
+ (UIFont *)updateFont:(UIFont *)font
            withFamily:(id)family
                  size:(id)size
                weight:(id)weight
                 style:(id)style
       scaleMultiplier:(CGFloat)scaleMultiplier;

+ (UIFont *)updateFont:(UIFont *)font withFamily:(id)json;
+ (UIFont *)updateFont:(UIFont *)font withSize:(id)json;
+ (UIFont *)updateFont:(UIFont *)font withWeight:(id)json;
+ (UIFont *)updateFont:(UIFont *)font withStyle:(id)json;

@end

@interface RCTConvert (RCTFont)

+ (UIFont *)UIFont:(id)json;

@end
