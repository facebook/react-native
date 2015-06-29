//
//  RCTImageRequestHandler.m
//  RCTImage
//
//  Created by Nick Lockwood on 09/06/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import "RCTImageRequestHandler.h"

#import <UIKit/UIKit.h>

#import "RCTImageLoader.h"
#import "RCTUtils.h"

@implementation RCTImageRequestHandler
{
  NSInteger _currentToken;
}

RCT_EXPORT_MODULE()

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [@[@"assets-library", @"ph"] containsObject:[request.URL.scheme lowercaseString]];
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  NSNumber *requestToken = @(++_currentToken);
  NSString *URLString = [request.URL absoluteString];
  [RCTImageLoader loadImageWithTag:URLString callback:^(NSError *error, UIImage *image) {
    if (error) {
      [delegate URLRequest:requestToken didCompleteWithError:error];
      return;
    }

    NSString *mimeType = nil;
    NSData *imageData = nil;
    if (RCTImageHasAlpha(image.CGImage)) {
      mimeType = @"image/png";
      imageData = UIImagePNGRepresentation(image);
    } else {
      mimeType = @"image/jpeg";
      imageData = UIImageJPEGRepresentation(image, 1.0);
    }

    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:mimeType
                                           expectedContentLength:imageData.length
                                                textEncodingName:nil];

    [delegate URLRequest:requestToken didReceiveResponse:response];
    [delegate URLRequest:requestToken didReceiveData:imageData];
    [delegate URLRequest:requestToken didCompleteWithError:nil];
  }];

  return requestToken;
}

@end
