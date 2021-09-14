/*
 *  Copyright (c) 2004-2016 Erik Doernenburg and contributors
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

#import <OCMock/OCMockObject.h>
#import <OCMock/OCMRecorder.h>
#import <OCMock/OCMStubRecorder.h>
#import <OCMock/OCMConstraint.h>
#import <OCMock/OCMArg.h>
#import <OCMock/OCMLocation.h>
#import <OCMock/OCMMacroState.h>
#import <OCMock/NSNotificationCenter+OCMAdditions.h>
#import <OCMock/OCMFunctions.h>


#define OCMClassMock(cls) [OCMockObject niceMockForClass:cls]

#define OCMStrictClassMock(cls) [OCMockObject mockForClass:cls]

#define OCMProtocolMock(protocol) [OCMockObject niceMockForProtocol:protocol]

#define OCMStrictProtocolMock(protocol) [OCMockObject mockForProtocol:protocol]

#define OCMPartialMock(obj) [OCMockObject partialMockForObject:obj]

#define OCMObserverMock() [OCMockObject observerMock]


#define OCMStub(invocation) \
({ \
    _OCMSilenceWarnings( \
        [OCMMacroState beginStubMacro]; \
        OCMStubRecorder *recorder = nil; \
        @try{ \
            invocation; \
        }@finally{ \
            recorder = [OCMMacroState endStubMacro]; \
        } \
        recorder; \
    ); \
})

#define OCMExpect(invocation) \
({ \
    _OCMSilenceWarnings( \
        [OCMMacroState beginExpectMacro]; \
        OCMStubRecorder *recorder = nil; \
        @try{ \
            invocation; \
        }@finally{ \
            recorder = [OCMMacroState endExpectMacro]; \
        } \
        recorder; \
    ); \
})

#define OCMReject(invocation) \
({ \
    _OCMSilenceWarnings( \
        [OCMMacroState beginRejectMacro]; \
        OCMStubRecorder *recorder = nil; \
        @try{ \
            invocation; \
        }@finally{ \
            recorder = [OCMMacroState endRejectMacro]; \
        } \
        recorder; \
    ); \
})

#define ClassMethod(invocation) \
    _OCMSilenceWarnings( \
        [[OCMMacroState globalState] switchToClassMethod]; \
        invocation; \
    );


#define OCMVerifyAll(mock) [mock verifyAtLocation:OCMMakeLocation(self, __FILE__, __LINE__)]

#define OCMVerifyAllWithDelay(mock, delay) [mock verifyWithDelay:delay atLocation:OCMMakeLocation(self, __FILE__, __LINE__)]

#define OCMVerify(invocation) \
({ \
    _OCMSilenceWarnings( \
        [OCMMacroState beginVerifyMacroAtLocation:OCMMakeLocation(self, __FILE__, __LINE__)]; \
        @try{ \
            invocation; \
        }@finally{ \
            [OCMMacroState endVerifyMacro]; \
        } \
    ); \
})

#define _OCMSilenceWarnings(macro) \
({ \
    _Pragma("clang diagnostic push") \
    _Pragma("clang diagnostic ignored \"-Wunused-value\"") \
    _Pragma("clang diagnostic ignored \"-Wunused-getter-return-value\"") \
    macro \
    _Pragma("clang diagnostic pop") \
})
