//
//  RCTLegacyModule.m
//  HelloWorld
//
//  Created by Riccardo Cipolleschi on 26/02/2025.
//

#import "RCTLegacyModule.h"

@implementation RCTLegacyModule

RCT_EXPORT_MODULE(LegacyModule)

RCT_EXPORT_METHOD(echo : (NSString *)message)
{
  NSLog(@"Echoing: %@", message);
}

@end
