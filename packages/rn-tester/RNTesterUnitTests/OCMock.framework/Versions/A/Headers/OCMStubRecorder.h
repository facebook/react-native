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

#import <OCMock/OCMRecorder.h>
#import <OCMock/OCMFunctions.h>
#import <objc/runtime.h>

@interface OCMStubRecorder : OCMRecorder

- (id)andReturn:(id)anObject;
- (id)andReturnValue:(NSValue *)aValue;
- (id)andThrow:(NSException *)anException;
- (id)andPost:(NSNotification *)aNotification;
- (id)andCall:(SEL)selector onObject:(id)anObject;
- (id)andDo:(void (^)(NSInvocation *invocation))block;
- (id)andForwardToRealObject;

@end


@interface OCMStubRecorder (Properties)

#define andReturn(aValue) _andReturn(({                                             \
  __typeof__(aValue) _val = (aValue);                                               \
  NSValue *_nsval = [NSValue value:&_val withObjCType:@encode(__typeof__(_val))];   \
  if (OCMIsObjectType(@encode(__typeof(_val)))) {                                   \
      objc_setAssociatedObject(_nsval, "OCMAssociatedBoxedValue", *(__unsafe_unretained id *) (void *) &_val, OBJC_ASSOCIATION_RETAIN); \
  }                                                                                 \
  _nsval;                                                                           \
}))
@property (nonatomic, readonly) OCMStubRecorder *(^ _andReturn)(NSValue *);

#define andThrow(anException) _andThrow(anException)
@property (nonatomic, readonly) OCMStubRecorder *(^ _andThrow)(NSException *);

#define andPost(aNotification) _andPost(aNotification)
@property (nonatomic, readonly) OCMStubRecorder *(^ _andPost)(NSNotification *);

#define andCall(anObject, aSelector) _andCall(anObject, aSelector)
@property (nonatomic, readonly) OCMStubRecorder *(^ _andCall)(id, SEL);

#define andDo(aBlock) _andDo(aBlock)
@property (nonatomic, readonly) OCMStubRecorder *(^ _andDo)(void (^)(NSInvocation *));

#define andForwardToRealObject() _andForwardToRealObject()
@property (nonatomic, readonly) OCMStubRecorder *(^ _andForwardToRealObject)(void);

@end



