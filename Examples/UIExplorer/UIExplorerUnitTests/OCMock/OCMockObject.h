/*
 *  Copyright (c) 2004-2014 Erik Doernenburg and contributors
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

@class OCMLocation;
@class OCMInvocationStub;
@class OCMStubRecorder;
@class OCMInvocationMatcher;
@class OCMInvocationExpectation;


@interface OCMockObject : NSProxy
{
	BOOL			isNice;
	BOOL			expectationOrderMatters;
	NSMutableArray	*stubs;
	NSMutableArray	*expectations;
	NSMutableArray	*exceptions;
    NSMutableArray  *invocations;
}

+ (id)mockForClass:(Class)aClass;
+ (id)mockForProtocol:(Protocol *)aProtocol;
+ (id)partialMockForObject:(NSObject *)anObject;

+ (id)niceMockForClass:(Class)aClass;
+ (id)niceMockForProtocol:(Protocol *)aProtocol;

+ (id)observerMock;

- (instancetype)init;

- (void)setExpectationOrderMatters:(BOOL)flag;

- (id)stub;
- (id)expect;
- (id)reject;

- (id)verify;
- (id)verifyAtLocation:(OCMLocation *)location;

- (void)verifyWithDelay:(NSTimeInterval)delay;
- (void)verifyWithDelay:(NSTimeInterval)delay atLocation:(OCMLocation *)location;

- (void)stopMocking;

// internal use only

- (void)addStub:(OCMInvocationStub *)aStub;
- (void)addExpectation:(OCMInvocationExpectation *)anExpectation;

- (BOOL)handleInvocation:(NSInvocation *)anInvocation;
- (void)handleUnRecordedInvocation:(NSInvocation *)anInvocation;
- (BOOL)handleSelector:(SEL)sel;

- (void)verifyInvocation:(OCMInvocationMatcher *)matcher;
- (void)verifyInvocation:(OCMInvocationMatcher *)matcher atLocation:(OCMLocation *)location;

@end

