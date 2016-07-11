/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "DeviceInfoModule.h"

@interface DeviceInfoModule()

@end

@implementation DeviceInfoModule
{

}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSString*) deviceId
{
  struct utsname systemInfo;

  uname(&systemInfo);

  return [NSString stringWithCString:systemInfo.machine
                                  encoding:NSUTF8StringEncoding];
}

- (NSString*) deviceName
{
  static NSDictionary* deviceNamesByCode = nil;

  if (!deviceNamesByCode) {

    deviceNamesByCode = @{@"i386"      :@"Simulator",
                          @"x86_64"    :@"Simulator",
                          @"iPod1,1"   :@"iPod Touch",      // (Original)
                          @"iPod2,1"   :@"iPod Touch",      // (Second Generation)
                          @"iPod3,1"   :@"iPod Touch",      // (Third Generation)
                          @"iPod4,1"   :@"iPod Touch",      // (Fourth Generation)
                          @"iPod5,1"   :@"iPod Touch",      // (Fifth Generation)
                          @"iPod7,1"   :@"iPod Touch",      // (Sixth Generation)
                          @"iPhone1,1" :@"iPhone",          // (Original)
                          @"iPhone1,2" :@"iPhone 3G",       // (3G)
                          @"iPhone2,1" :@"iPhone 3GS",      // (3GS)
                          @"iPad1,1"   :@"iPad",            // (Original)
                          @"iPad2,1"   :@"iPad 2",          //
                          @"iPad2,2"   :@"iPad 2",          //
                          @"iPad2,3"   :@"iPad 2",          //
                          @"iPad2,4"   :@"iPad 2",          //
                          @"iPad3,1"   :@"iPad",            // (3rd Generation)
                          @"iPad3,2"   :@"iPad",            // (3rd Generation)
                          @"iPad3,3"   :@"iPad",            // (3rd Generation)
                          @"iPhone3,1" :@"iPhone 4",        // (GSM)
                          @"iPhone3,2" :@"iPhone 4",        // iPhone 4
                          @"iPhone3,3" :@"iPhone 4",        // (CDMA/Verizon/Sprint)
                          @"iPhone4,1" :@"iPhone 4S",       //
                          @"iPhone5,1" :@"iPhone 5",        // (model A1428, AT&T/Canada)
                          @"iPhone5,2" :@"iPhone 5",        // (model A1429, everything else)
                          @"iPad3,4"   :@"iPad",            // (4th Generation)
                          @"iPad3,5"   :@"iPad",            // (4th Generation)
                          @"iPad3,6"   :@"iPad",            // (4th Generation)
                          @"iPad2,5"   :@"iPad Mini",       // (Original)
                          @"iPad2,6"   :@"iPad Mini",       // (Original)
                          @"iPad2,7"   :@"iPad Mini",       // (Original)
                          @"iPhone5,3" :@"iPhone 5c",       // (model A1456, A1532 | GSM)
                          @"iPhone5,4" :@"iPhone 5c",       // (model A1507, A1516, A1526 (China), A1529 | Global)
                          @"iPhone6,1" :@"iPhone 5s",       // (model A1433, A1533 | GSM)
                          @"iPhone6,2" :@"iPhone 5s",       // (model A1457, A1518, A1528 (China), A1530 | Global)
                          @"iPhone7,1" :@"iPhone 6 Plus",   //
                          @"iPhone7,2" :@"iPhone 6",        //
                          @"iPhone8,1" :@"iPhone 6s",       //
                          @"iPhone8,2" :@"iPhone 6s Plus",  //
                          @"iPhone8,4" :@"iPhone SE",       //
                          @"iPad4,1"   :@"iPad Air",        // 5th Generation iPad (iPad Air) - Wifi
                          @"iPad4,2"   :@"iPad Air",        // 5th Generation iPad (iPad Air) - Cellular
                          @"iPad4,3"   :@"iPad Air",        // 5th Generation iPad (iPad Air)
                          @"iPad4,4"   :@"iPad Mini 2",     // (2nd Generation iPad Mini - Wifi)
                          @"iPad4,5"   :@"iPad Mini 2",     // (2nd Generation iPad Mini - Cellular)
                          @"iPad4,6"   :@"iPad Mini 2",     // (2nd Generation iPad Mini)
                          @"iPad4,7"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                          @"iPad4,8"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                          @"iPad4,9"   :@"iPad Mini 3",     // (3rd Generation iPad Mini)
                          @"iPad5,1"   :@"iPad Mini 4",     // (4th Generation iPad Mini)
                          @"iPad5,2"   :@"iPad Mini 4",     // (4th Generation iPad Mini)
                          @"iPad5,3"   :@"iPad Air 2",      // 6th Generation iPad (iPad Air 2)
                          @"iPad5,4"   :@"iPad Air 2",      // 6th Generation iPad (iPad Air 2)
                          @"iPad6,3"   :@"iPad Pro 9.7-inch",// iPad Pro 9.7-inch
                          @"iPad6,4"   :@"iPad Pro 9.7-inch",// iPad Pro 9.7-inch
                          @"iPad6,7"   :@"iPad Pro 12.9-inch",// iPad Pro 12.9-inch
                          @"iPad6,8"   :@"iPad Pro 12.9-inch",// iPad Pro 12.9-inch
                          @"AppleTV2,1":@"Apple TV",        // Apple TV (2nd Generation)
                          @"AppleTV3,1":@"Apple TV",        // Apple TV (3rd Generation)
                          @"AppleTV3,2":@"Apple TV",        // Apple TV (3rd Generation - Rev A)
                          @"AppleTV5,3":@"Apple TV",        // Apple TV (4th Generation)
                          };
  }

  NSString* deviceName = [deviceNamesByCode objectForKey:self.deviceId];

  if (!deviceName) {
    // Not found on database. At least guess main device type from string contents:

    if ([self.deviceId rangeOfString:@"iPod"].location != NSNotFound) {
        deviceName = @"iPod Touch";
    }
    else if([self.deviceId rangeOfString:@"iPad"].location != NSNotFound) {
        deviceName = @"iPad";
    }
    else if([self.deviceId rangeOfString:@"iPhone"].location != NSNotFound){
        deviceName = @"iPhone";
    }
  }

  return deviceName;
}

- (NSString*) userAgent
{
  UIWebView* webView = [[UIWebView alloc] initWithFrame:CGRectZero];
  return [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
}

- (NSString*) deviceLocale
{
  NSString *language = [[NSLocale preferredLanguages] objectAtIndex:0];
  return language;
}

- (NSString*) deviceCountry
{
  NSString *country = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  return country;
}

- (NSDictionary *)constantsToExport
{
  UIDevice *currentDevice = [UIDevice currentDevice];

  NSUUID *identifierForVendor = [currentDevice identifierForVendor];
  NSString *uniqueId = [identifierForVendor UUIDString];

  return @{
           @"SystemName": currentDevice.systemName,
           @"SystemVersion": currentDevice.systemVersion,
           @"Model": self.deviceName,
           @"DeviceID": self.deviceId,
           @"DeviceName": currentDevice.name,
           @"DeviceLocale": self.deviceLocale,
           @"DeviceCountry": self.deviceCountry,
           @"UniqueID": uniqueId,
           @"PackageName": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleIdentifier"],
           @"AppVersion": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"],
           @"BuildNumber": [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"],
           @"Manufacturer": @"Apple",
           @"UserAgent": self.userAgent,
           };
}

@end
