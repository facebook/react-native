/*
 * Copyright 2018-present Facebook, Inc.
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

#include <atomic>
#include <memory>

///
/// Forward declatations and implicit documentation of all hazptr
/// top-level classes, functions, macros, default values, and globals.
///

/** FOLYY_HAZPTR_THR_LOCAL */
#if FOLLY_MOBILE
#define FOLLY_HAZPTR_THR_LOCAL false
#else
#define FOLLY_HAZPTR_THR_LOCAL true
#endif

namespace folly {

///
/// Hazard pointer record.
/// Defined in HazptrRec.h
///

/** hazptr_rec */
template <template <typename> class Atom = std::atomic>
class hazptr_rec;

///
/// Classes related to objects protected by hazard pointers.
/// Defined in HazptrObj.h
///

/** hazptr_obj */
template <template <typename> class Atom = std::atomic>
class hazptr_obj;

/** hazptr_obj_list */
template <template <typename> class Atom = std::atomic>
class hazptr_obj_list;

/** hazptr_deleter */
template <typename T, typename D>
class hazptr_deleter;

/** hazptr_obj_base */
template <
    typename T,
    template <typename> class Atom = std::atomic,
    typename D = std::default_delete<T>>
class hazptr_obj_base;

///
/// Classes related to link counted objects and automatic retirement.
/// Defined in HazptrLinked.h
///

/** hazptr_root */
template <typename T, template <typename> class Atom = std::atomic>
class hazptr_root;

/** hazptr_obj_linked */
template <template <typename> class Atom = std::atomic>
class hazptr_obj_linked;

/** hazptr_obj_base_linked */
template <
    typename T,
    template <typename> class Atom = std::atomic,
    typename Deleter = std::default_delete<T>>
class hazptr_obj_base_linked;

///
/// Classes and functions related to thread local structures.
/// Defined in HazptrThrLocal.h
///

/** hazptr_tc_entry */
template <template <typename> class Atom = std::atomic>
class hazptr_tc_entry;

/** hazptr_tc */
template <template <typename> class Atom = std::atomic>
class hazptr_tc;

/** hazptr_tc_tls */
template <template <typename> class Atom = std::atomic>
hazptr_tc<Atom>& hazptr_tc_tls();

/** hazptr_priv */
template <template <typename> class Atom = std::atomic>
class hazptr_priv;

/** hazptr_priv_tls */
template <template <typename> class Atom = std::atomic>
hazptr_priv<Atom>& hazptr_priv_tls();

///
/// Hazard pointer domain
/// Defined in HazptrDomain.h
///

/** hazptr_domain */
template <template <typename> class Atom = std::atomic>
class hazptr_domain;

/** default_hazptr_domain */
template <template <typename> class Atom = std::atomic>
hazptr_domain<Atom>& default_hazptr_domain();

/** hazptr_domain_push_retired */
template <template <typename> class Atom = std::atomic>
void hazptr_domain_push_retired(
    hazptr_obj_list<Atom>& l,
    bool check = true,
    hazptr_domain<Atom>& domain = default_hazptr_domain<Atom>()) noexcept;

/** hazptr_retire */
template <
    template <typename> class Atom = std::atomic,
    typename T,
    typename D = std::default_delete<T>>
void hazptr_retire(T* obj, D reclaim = {});

/** hazptr_cleanup */
template <template <typename> class Atom = std::atomic>
void hazptr_cleanup(
    hazptr_domain<Atom>& domain = default_hazptr_domain<Atom>()) noexcept;

/** Global default domain defined in Hazptr.cpp */
extern hazptr_domain<std::atomic> default_domain;

///
/// Classes related to hazard pointer holders.
/// Defined in HazptrHolder.h
///

/** hazptr_holder */
template <template <typename> class Atom = std::atomic>
class hazptr_holder;

/** Free function swap of hazptr_holder-s */
template <template <typename> class Atom = std::atomic>
void swap(hazptr_holder<Atom>&, hazptr_holder<Atom>&) noexcept;

/** hazptr_array */
template <uint8_t M = 1, template <typename> class Atom = std::atomic>
class hazptr_array;

/** hazptr_local */
template <uint8_t M = 1, template <typename> class Atom = std::atomic>
class hazptr_local;

} // namespace folly
