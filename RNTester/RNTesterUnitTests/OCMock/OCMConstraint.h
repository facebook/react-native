/*
 *  Copyright (c) 2007-2014 Erik Doernenburg and contributors
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


@interface OCMConstraint : NSObject

+ (instancetype)constraint;
- (BOOL)evaluate:(id)value;

// if you are looking for any, isNil, etc, they have moved to OCMArg

// try to use [OCMArg checkWith...] instead of the constraintWith... methods below

+ (instancetype)constraintWithSelector:(SEL)aSelector onObject:(id)anObject;
+ (instancetype)constraintWithSelector:(SEL)aSelector onObject:(id)anObject withValue:(id)aValue;


@end

@interface OCMAnyConstraint : OCMConstraint
@end

@interface OCMIsNilConstraint : OCMConstraint
@end

@interface OCMIsNotNilConstraint : OCMConstraint
@end

@interface OCMIsNotEqualConstraint : OCMConstraint
{
	@public
	id testValue;
}

@end

@interface OCMInvocationConstraint : OCMConstraint
{
	@public
	NSInvocation *invocation;
}

@end

@interface OCMBlockConstraint : OCMConstraint
{
	BOOL (^block)(id);
}

- (instancetype)initWithConstraintBlock:(BOOL (^)(id))block;

@end


#define CONSTRAINT(aSelector) [OCMConstraint constraintWithSelector:aSelector onObject:self]
#define CONSTRAINTV(aSelector, aValue) [OCMConstraint constraintWithSelector:aSelector onObject:self withValue:(aValue)]
