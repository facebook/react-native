/*
 *  Copyright (c) 2014-2016 Erik Doernenburg and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may
 *  not use these files except in compliance with the License. You may obtain
 *  a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

#import <Foundation/Foundation.h>
#import "OCMFunctions.h"


@interface OCMLocation : NSObject
{
    id          testCase;
    NSString    *file;
    NSUInteger  line;
}

+ (instancetype)locationWithTestCase:(id)aTestCase file:(NSString *)aFile line:(NSUInteger)aLine;

- (instancetype)initWithTestCase:(id)aTestCase file:(NSString *)aFile line:(NSUInteger)aLine;

- (id)testCase;
- (NSString *)file;
- (NSUInteger)line;

@end

OCMOCK_EXTERN OCMLocation *OCMMakeLocation(id testCase, const char *file, int line);
