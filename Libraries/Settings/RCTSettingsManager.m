/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSettingsManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

@implementation RCTSettingsManager
{
  BOOL _ignoringUpdates;
  NSUserDefaults *_defaults;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults
{
  if ((self = [self init])) {
    _defaults = defaults;
  }
  return self;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  if (!_defaults) {
    _defaults = [NSUserDefaults standardUserDefaults];
  }

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(userDefaultsDidChange:)
                                               name:NSUserDefaultsDidChangeNotification
                                             object:_defaults];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"settings": RCTJSONClean([_defaults dictionaryRepresentation])};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)userDefaultsDidChange:(NSNotification *)note
{
  if (_ignoringUpdates) {
    return;
  }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [_bridge.eventDispatcher
   sendDeviceEventWithName:@"settingsUpdated"
   body:RCTJSONClean([_defaults dictionaryRepresentation])];
#pragma clang diagnostic pop
}

/**
 * Set one or more values in the settings.
 * TODO: would it be useful to have a callback for when this has completed?
 */
RCT_EXPORT_METHOD(setValues:(NSDictionary *)values)
{
  _ignoringUpdates = YES;
  [values enumerateKeysAndObjectsUsingBlock:^(NSString *key, id json, BOOL *stop) {
    id plist = [RCTConvert NSPropertyList:json];
    if (plist) {
      [self->_defaults setObject:plist forKey:key];
    } else {
      [self->_defaults removeObjectForKey:key];
    }
  }];

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

/**
 * Remove some values from the settings.
 */
RCT_EXPORT_METHOD(deleteValues:(NSArray<NSString *> *)keys)
{
  _ignoringUpdates = YES;
  for (NSString *key in keys) {
    [_defaults removeObjectForKey:key];
  }

  [_defaults synchronize];
  _ignoringUpdates = NO;
}

@end
