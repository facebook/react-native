//
//  RCTUnicodeDecodeTests.m
//  UIExplorer
//
//  Created by Leo Natan (Wix) on 27/10/2016.
//  Copyright © 2016 Facebook. All rights reserved.
//

@import XCTest;
@import ObjectiveC;

#import "RCTNetworking.h"

@interface RCTNetworking ()

+ (NSString *)decodeTextData:(NSData *)data fromResponse:(NSURLResponse *)response withCarryStorage:(NSMutableData*)carryStorage;

@end

@interface RCTUnicodeDecodeTests : XCTestCase @end

@implementation RCTUnicodeDecodeTests

- (void)testUnicodeDecode
{
	NSString* unicodeString = @"שששששששששששששששששששששששששששששששששששששששש";
	NSData* unicodeBytes = [unicodeString dataUsingEncoding:NSUTF8StringEncoding];
	
	NSURLResponse* fakeResponse = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"testurl://"] statusCode:200 HTTPVersion:@"1.1" headerFields:@{@"content-type": @"text/plain; charset=utf-8"}];
	XCTAssert([fakeResponse.textEncodingName isEqualToString:@"utf-8"]);
	
	NSMutableData* carryStorage = [NSMutableData new];
	NSMutableString* parsedString = [NSMutableString new];
	
	[parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(0, 11)] fromResponse:fakeResponse withCarryStorage:carryStorage]];
	
	XCTAssert(carryStorage.length == 1);
	
	[parsedString appendString:[RCTNetworking decodeTextData:[unicodeBytes subdataWithRange:NSMakeRange(11, unicodeBytes.length - 11)] fromResponse:fakeResponse withCarryStorage:carryStorage]];
	
	XCTAssert(carryStorage.length == 0);
	
	XCTAssert([parsedString isEqualToString:unicodeString]);
}

@end
