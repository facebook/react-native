/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <fabric/imagemanager/primitives.h>
#import <React/RCTImageLoader.h>

using namespace facebook::react;

inline static RCTResizeMode RCTResizeModeFromImageResizeMode(ImageResizeMode imageResizeMode) {
  switch (imageResizeMode) {
    case ImageResizeMode::Cover: return RCTResizeModeCover;
    case ImageResizeMode::Contain: return RCTResizeModeContain;
    case ImageResizeMode::Stretch: return RCTResizeModeStretch;
    case ImageResizeMode::Center: return RCTResizeModeCenter;
    case ImageResizeMode::Repeat: return RCTResizeModeRepeat;
  }
}

inline std::string toString(const ImageResizeMode &value) {
  switch (value) {
    case ImageResizeMode::Cover: return "cover";
    case ImageResizeMode::Contain: return "contain";
    case ImageResizeMode::Stretch: return "stretch";
    case ImageResizeMode::Center: return "center";
    case ImageResizeMode::Repeat: return "repeat";
  }
}

inline static NSURLRequest *NSURLRequestFromImageSource(const ImageSource &imageSource) {

  NSString *urlString = [NSString stringWithCString:imageSource.uri.c_str()
                                           encoding:NSASCIIStringEncoding];

  if (!imageSource.bundle.empty()) {
    NSString *bundle = [NSString stringWithCString:imageSource.bundle.c_str()
                                          encoding:NSASCIIStringEncoding];
    urlString = [NSString stringWithFormat:@"%@.bundle/%@", bundle, urlString];
  }

  NSURL *url = [[NSURL alloc] initWithString:urlString];

  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

  /*
  // TODO(shergin): To be implemented.
  request.HTTPBody = ...;
  request.HTTPMethod = ...;
  request.cachePolicy = ...;
  request.allHTTPHeaderFields = ...;
  */

  return [request copy];
}
