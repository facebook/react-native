/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTImageLoader.h>
#import <react/renderer/imagemanager/primitives.h>

inline static UIViewContentMode RCTContentModeFromImageResizeMode(facebook::react::ImageResizeMode imageResizeMode)
{
  switch (imageResizeMode) {
    case facebook::react::ImageResizeMode::Cover:
      return UIViewContentModeScaleAspectFill;
    case facebook::react::ImageResizeMode::Contain:
      return UIViewContentModeScaleAspectFit;
    case facebook::react::ImageResizeMode::Stretch:
      return UIViewContentModeScaleToFill;
    case facebook::react::ImageResizeMode::Center:
      return UIViewContentModeCenter;
    case facebook::react::ImageResizeMode::Repeat:
      // Repeat resize mode is handled by the UIImage. Use scale to fill
      // so the repeated image fills the UIImageView.
      return UIViewContentModeScaleToFill;
  }
}

inline std::string toString(const facebook::react::ImageResizeMode &value)
{
  switch (value) {
    case facebook::react::ImageResizeMode::Cover:
      return "cover";
    case facebook::react::ImageResizeMode::Contain:
      return "contain";
    case facebook::react::ImageResizeMode::Stretch:
      return "stretch";
    case facebook::react::ImageResizeMode::Center:
      return "center";
    case facebook::react::ImageResizeMode::Repeat:
      return "repeat";
  }
}

inline static NSURL *NSURLFromImageSource(const facebook::react::ImageSource &imageSource)
{
  // `NSURL` has a history of crashing with bad input, so let's be safe.
  @try {
    NSString *urlString = [NSString stringWithUTF8String:imageSource.uri.c_str()];

    if (!imageSource.bundle.empty()) {
      NSString *bundle = [NSString stringWithUTF8String:imageSource.bundle.c_str()];
      urlString = [NSString stringWithFormat:@"%@.bundle/%@", bundle, urlString];
    }

    NSURL *url = [[NSURL alloc] initWithString:urlString];

    if (url.scheme) {
      // Well-formed absolute URL.
      return url;
    }

    if ([urlString rangeOfString:@":"].location != NSNotFound) {
      // The URL has a scheme.
      urlString =
          [urlString stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLQueryAllowedCharacterSet]];
      url = [NSURL URLWithString:urlString];
      return url;
    }

    // Assume that it's a local path.
    urlString = [urlString stringByRemovingPercentEncoding];

    if ([urlString hasPrefix:@"~"]) {
      // Path is inside user directory.
      urlString = [urlString stringByExpandingTildeInPath];
    } else {
      if (![urlString isAbsolutePath]) {
        // Assume it's a resource path.
        urlString = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:urlString];
      }
    }

    url = [NSURL fileURLWithPath:urlString];

    return url;
  } @catch (__unused NSException *exception) {
    return nil;
  }
}

inline static NSURLRequest *NSURLRequestFromImageSource(const facebook::react::ImageSource &imageSource)
{
  NSURL *url = NSURLFromImageSource(imageSource);

  if (!url) {
    RCTLogError(@"URI parsing error.");
    return nil;
  }

  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

  /*
  // TODO(shergin): To be implemented.
  request.HTTPBody = ...;
  request.HTTPMethod = ...;
  request.cachePolicy = ...;
  request.allHTTPHeaderFields = ...;
  */
  for (const auto &header : imageSource.headers) {
    NSString *key = [NSString stringWithUTF8String:header.first.c_str()];
    NSString *value = [NSString stringWithUTF8String:header.second.c_str()];
    if (key != NULL && value != NULL) {
      [request setValue:value forHTTPHeaderField:key];
    }
  }

  return [request copy];
}
