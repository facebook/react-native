/*
 * Copyright 2011-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

/*
 * This file contains convenience aliases that make boost::intrusive::list
 * easier to use.
 */

#include <boost/intrusive/list.hpp>

namespace folly {

/**
 * An auto-unlink intrusive list hook.
 */
using IntrusiveListHook = boost::intrusive::list_member_hook<
    boost::intrusive::link_mode<boost::intrusive::auto_unlink>>;

/**
 * An intrusive list.
 *
 * An IntrusiveList always uses an auto-unlink hook.
 * Beware that IntrusiveList::size() is an O(n) operation, since it has to walk
 * the entire list.
 *
 * Example usage:
 *
 *   class Foo {
 *     // Note that the listHook member variable needs to be visible
 *     // to the code that defines the IntrusiveList instantiation.
 *     // The list hook can be made public, or you can make the other class a
 *     // friend.
 *     IntrusiveListHook listHook;
 *   };
 *
 *   using FooList = IntrusiveList<Foo, &Foo::listHook>;
 *
 *   Foo *foo = new Foo();
 *   FooList myList;
 *   myList.push_back(*foo);
 *
 * Note that each IntrusiveListHook can only be part of a single list at any
 * given time.  If you need the same object to be stored in two lists at once,
 * you need to use two different IntrusiveListHook member variables.
 *
 * The elements stored in the list must contain an IntrusiveListHook member
 * variable.
 */
template <typename T, IntrusiveListHook T::*PtrToMember>
using IntrusiveList = boost::intrusive::list<
    T,
    boost::intrusive::member_hook<T, IntrusiveListHook, PtrToMember>,
    boost::intrusive::constant_time_size<false>>;

/**
 * A safe-link intrusive list hook.
 */
using SafeIntrusiveListHook = boost::intrusive::list_member_hook<
    boost::intrusive::link_mode<boost::intrusive::safe_link>>;

/**
 * An intrusive list with const-time size() method.
 *
 * A CountedIntrusiveList always uses a safe-link hook.
 * CountedIntrusiveList::size() is an O(1) operation. Users of this type
 * of lists need to remove a member from a list by calling one of the
 * methods on the list (e.g., erase(), pop_front(), etc.), rather than
 * calling unlink on the member's list hook. Given references to a
 * list and a member, a constant-time removal operation can be
 * accomplished by list.erase(list.iterator_to(member)). Also, when a
 * member is destroyed, it is NOT automatically removed from the list.
 *
 * Example usage:
 *
 *   class Foo {
 *     // Note that the listHook member variable needs to be visible
 *     // to the code that defines the CountedIntrusiveList instantiation.
 *     // The list hook can be made public, or you can make the other class a
 *     // friend.
 *     SafeIntrusiveListHook listHook;
 *   };
 *
 *   using FooList = CountedIntrusiveList<Foo, &Foo::listHook> FooList;
 *
 *   Foo *foo = new Foo();
 *   FooList myList;
 *   myList.push_back(*foo);
 *   myList.pop_front();
 *
 * Note that each SafeIntrusiveListHook can only be part of a single list at any
 * given time.  If you need the same object to be stored in two lists at once,
 * you need to use two different SafeIntrusiveListHook member variables.
 *
 * The elements stored in the list must contain an SafeIntrusiveListHook member
 * variable.
 */
template <typename T, SafeIntrusiveListHook T::*PtrToMember>
using CountedIntrusiveList = boost::intrusive::list<
    T,
    boost::intrusive::member_hook<T, SafeIntrusiveListHook, PtrToMember>,
    boost::intrusive::constant_time_size<true>>;

} // namespace folly
