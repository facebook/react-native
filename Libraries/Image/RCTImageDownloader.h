// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

typedef void (^RCTDataDownloadBlock)(NSData *data, NSError *error);
typedef void (^RCTImageDownloadBlock)(UIImage *image, NSError *error);

@interface RCTImageDownloader : NSObject

+ (instancetype)sharedInstance;

- (id)downloadDataForURL:(NSURL *)url
                   block:(RCTDataDownloadBlock)block;

- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
                    block:(RCTImageDownloadBlock)block;

- (void)cancelDownload:(id)downloadToken;

@end
