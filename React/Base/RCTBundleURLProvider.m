/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBundleURLProvider.h"
#import "RCTDefines.h"
#import "RCTConvert.h"

NSString *const RCTBundleURLProviderUpdatedNotification = @"RCTBundleURLProviderUpdatedNotification";

static NSString *const kRCTJsLocationKey = @"RCT_jsLocation";
static NSString *const kRCTEnableLiveReloadKey = @"RCT_enableLiveReload";
static NSString *const kRCTEnableDevKey = @"RCT_enableDev";
static NSString *const kRCTEnableMinificationKey = @"RCT_enableMinification";

static NSString *const kDefaultPort = @"8081";

@implementation RCTBundleURLProvider

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self setDefaults];
  }
  return self;
}

- (NSDictionary *)defaults
{
  return @{
    kRCTEnableLiveReloadKey: @NO,
    kRCTEnableDevKey: @YES,
    kRCTEnableMinificationKey: @NO,
  };
}

- (void)settingsUpdated
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTBundleURLProviderUpdatedNotification object:self];
}

- (void)setDefaults
{
  [[NSUserDefaults standardUserDefaults] registerDefaults:[self defaults]];
}

- (void)resetToDefaults
{
  for (NSString *key in [[self defaults] allKeys]) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
  }
  [self setDefaults];
  [self settingsUpdated];
}

static NSString *serverRootWithHost(NSString *host)
{
  return [NSString stringWithFormat:@"http://%@:%@/", host, kDefaultPort];
}

#if RCT_DEV
- (BOOL)isPackagerRunning:(NSString *)host
{
  NSURL *url = [[NSURL URLWithString:serverRootWithHost(host)] URLByAppendingPathComponent:@"status"];
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  NSURLResponse *response;
  NSData *data = [NSURLConnection sendSynchronousRequest:request returningResponse:&response error:NULL];
  NSString *status = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  return [status isEqualToString:@"packager-status:running"];
}

- (NSString *)guessPackagerHost
{
  static NSString *ipGuess;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
    ipGuess = [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:nil]
               stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  });

  NSString *host = ipGuess ?: @"localhost";
  if ([self isPackagerRunning:host]) {
    return host;
  }
  return nil;
}
#endif

- (NSString *)packagerServerRoot
{
  NSString *location = [self jsLocation];
  if (location != nil) {
    return serverRootWithHost(location);
  }
#if RCT_DEV
  NSString *host = [self guessPackagerHost];
  if (host) {
    return serverRootWithHost(host);
  }
#endif
  return nil;
}

- (NSURL *)packagerServerURL
{
  NSString *root = [self packagerServerRoot];
  return root ? [NSURL URLWithString:root] : nil;
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName
{
  resourceName = resourceName ?: @"main";
  NSString *serverRoot = [self packagerServerRoot];
  if (!serverRoot) {
    return [[NSBundle mainBundle] URLForResource:resourceName withExtension:@"jsbundle"];
  } else {
    NSString *fullBundlePath = [serverRoot stringByAppendingFormat:@"%@.bundle", bundleRoot];
    if ([fullBundlePath hasPrefix:@"http"]) {
      NSString *dev = [self enableDev] ? @"true" : @"false";
      NSString *min = [self enableMinification] ? @"true": @"false";
      fullBundlePath = [fullBundlePath stringByAppendingFormat:@"?platform=ios&dev=%@&minify=%@", dev, min];
    }
    return [NSURL URLWithString:fullBundlePath];
  }
}

- (void)updateValue:(id)object forKey:(NSString *)key
{
  [[NSUserDefaults standardUserDefaults] setObject:object forKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self settingsUpdated];
}

- (BOOL)enableDev
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableDevKey];
}

- (BOOL)enableLiveReload
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableLiveReloadKey];
}

- (BOOL)enableMinification
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kRCTEnableMinificationKey];
}

- (NSString *)jsLocation
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kRCTJsLocationKey];
}

- (void)setEnableDev:(BOOL)enableDev
{
  [self updateValue:@(enableDev) forKey:kRCTEnableDevKey];
}

- (void)setEnableLiveReload:(BOOL)enableLiveReload
{
  [self updateValue:@(enableLiveReload) forKey:kRCTEnableLiveReloadKey];
}

- (void)setJsLocation:(NSString *)jsLocation
{
  [self updateValue:jsLocation forKey:kRCTJsLocationKey];
}

- (void)setEnableMinification:(BOOL)enableMinification
{
  [self updateValue:@(enableMinification) forKey:kRCTEnableMinificationKey];
}

+ (instancetype)sharedSettings
{
  static RCTBundleURLProvider *sharedInstance;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    sharedInstance = [RCTBundleURLProvider new];
  });
  return sharedInstance;
}

@end
