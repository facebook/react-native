// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTImageDownloader.h"
#import "RCTUtils.h"

// TODO: something a bit more sophisticated

@implementation RCTImageDownloader

+ (instancetype)sharedInstance
{
  RCTAssertMainThread();
  static RCTImageDownloader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

- (id)downloadDataForURL:(NSURL *)url
                   block:(RCTDataDownloadBlock)block
{
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    // Dispatch back to main thread
    dispatch_async(dispatch_get_main_queue(), ^{
      block(data, error);
    });
  }];
  
  [task resume];
  return task;
}

- (id)downloadImageForURL:(NSURL *)url
                     size:(CGSize)size
                    scale:(CGFloat)scale
                    block:(RCTImageDownloadBlock)block
{
  NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithURL:url completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
    
    UIImage *image = [UIImage imageWithData:data scale:scale];
    
    // TODO: cache compressed image
    
    CGSize imageSize = size;
    if (CGSizeEqualToSize(imageSize, CGSizeZero)) {
      imageSize = image.size;
    }
    
    CGFloat imageScale = scale;
    if (imageScale == 0 || imageScale > image.scale) {
      imageScale = image.scale;
    }
  
    if (image) {
      // Decompress on background thread
      UIGraphicsBeginImageContextWithOptions(imageSize, NO, imageScale);
      [image drawInRect:(CGRect){{0, 0}, imageSize}];
      image = UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
      
      // TODO: cache decompressed images at each requested size
    }
    
    // Dispatch back to main thread
    dispatch_async(dispatch_get_main_queue(), ^{
      block(image, error);
    });
  }];
  
  [task resume];
  return task;
}

- (void)cancelDownload:(id)downloadToken
{
  [(NSURLSessionDataTask *)downloadToken cancel];
}

@end
