// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>

@class ALAssetsLibrary;
@class UIImage;

@interface RCTImageLoader : NSObject

+ (ALAssetsLibrary *)assetsLibrary;
+ (void)loadImageWithTag:(NSString *)tag callback:(void (^)(NSError *error, UIImage *image))callback;

@end
