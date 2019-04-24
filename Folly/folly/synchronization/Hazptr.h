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

#include <folly/synchronization/Hazptr-fwd.h>
#include <folly/synchronization/HazptrDomain.h>
#include <folly/synchronization/HazptrHolder.h>
#include <folly/synchronization/HazptrObj.h>
#include <folly/synchronization/HazptrObjLinked.h>
#include <folly/synchronization/HazptrRec.h>
#include <folly/synchronization/HazptrThrLocal.h>

/// Hazard pointers is a safe reclamation method. It protects objects
/// from being reclaimed while being accessed by one or more threads, but
/// allows objects to be removed concurrently while being accessed.
///
/// What is a Hazard Pointer?
/// -------------------------
/// A hazard pointer is a single-writer multi-reader pointer that can
/// be owned by at most one thread at a time. To protect an object A
/// from being reclaimed while in use, a thread X sets one of its
/// owned hazard pointers, P, to the address of A. If P is set to &A
/// before A is removed (i.e., it becomes unreachable) then A will not be
/// reclaimed as long as P continues to hold the value &A.
///
/// Why use hazard pointers?
/// ------------------------
/// - Speed and scalability.
/// - Can be used while blocking.
///
/// When not to use hazard pointers?
/// --------------------------------
/// - When thread local data is not supported efficiently.
///
/// Basic Interface
/// ---------------
/// - In the hazptr library, raw hazard pointers are not exposed to
///   users. Instead, each instance of the class hazptr_holder owns
///   and manages at most one hazard pointer.
/// - Typically classes of objects protected by hazard pointers are
///   derived from a class template hazptr_obj_base that provides a
///   member function retire(). When an object A is removed,
///   A.retire() is called to pass responsibility for reclaiming A to
///   the hazptr library. A will be reclaimed only after it is not
///   protected by hazard pointers.
/// - The essential components of the hazptr API are:
///   o hazptr_holder: Class that owns and manages a hazard pointer.
///   o get_protected: Mmember function of hazptr_holder. Protects
///     an object pointed to by an atomic source (if not null).
///       T* get_protected(const atomic<T*>& src);
///   o hazptr_obj_base<T>: Base class for protected objects.
///   o retire: Member function of hazptr_obj_base that automatically
///     reclaims the object when safe.
///       void retire();
///
/// Default Domain and Default Deleters
/// -----------------------------------
/// - Most uses do not need to specify custom domains and custom
///   deleters, and by default use the default domain and default
///   deleters.
///
/// Simple usage example
/// --------------------
///   class Config : public hazptr_obj_base<Config> {
///     /* ... details ... */
///     U get_config(V v);
///   };
///
///   std::atomic<Config*> config_;
///
///   // Called frequently
///   U get_config(V v) {
///     hazptr_holder h; /* h owns a hazard pointer */
///     Config* ptr = h.get_protected(config_);
///     /* safe to access *ptr as long as it is protected by h */
///     return ptr->get_config(v);
///     /* h dtor resets and releases the owned hazard pointer,
///        *ptr will be no longer protected by this hazard pointer */
///   }
///
///   // called rarely
///   void update_config(Config* new_config) {
///     Config* ptr = config_.exchange(new_config);
///     ptr->retire() // Member function of hazptr_obj_base<Config>
///   }
///
/// Optimized Holders
/// -----------------
/// - The template hazptr_array<M> provides most of the functionality
///   of M hazptr_holder-s but with faster construction/destruction
///   (for M > 1), at the cost of restrictions (on move and swap).
/// - The template hazptr_local<M> provides greater speed even when
///   M=1 (~2 ns vs ~5 ns for construction/destruction) but it is
///   unsafe for the current thread to construct any other holder-type
///   objects (hazptr_holder, hazptr_array and other hazptr_local)
///   while the current instance exists.
/// - In the above example, if Config::get_config() and all of its
///   descendants are guaranteed not to use hazard pointers, then it
///   can be faster (by ~3 ns.) to use
///     hazptr_local<1> h;
///     Config* ptr = h[0].get_protected(config_);
///  than
///     hazptr_holder h;
///     Config* ptr = h.get_protected(config_);
///
/// Memory Usage
/// ------------
/// - The size of the metadata for the hazptr library is linear in the
///   number of threads using hazard pointers, assuming a constant
///   number of hazard pointers per thread, which is typical.
/// - The typical number of reclaimable but not yet reclaimed of
///   objects is linear in the number of hazard pointers, which
///   typically is linear in the number of threads using hazard
///   pointers.
///
/// Protecting Linked Structures and Automatic Retirement
/// -----------------------------------------------------
/// Hazard pointers provide link counting API to protect linked
/// structures. It is capable of automatic retirement of objects even
/// when the removal of objects is uncertain. It also supports
/// optimizations when links are known to be immutable. All the link
/// counting features incur no extra overhead for readers.
/// See HazptrObjLinked.h for more details.
///
/// Alternative Safe Reclamation Methods
/// ------------------------------------
/// - Locking (exclusive or shared):
///   o Pros: simple to reason about.
///   o Cons: serialization, high reader overhead, high contention, deadlock.
///   o When to use: When speed and contention are not critical, and
///     when deadlock avoidance is simple.
/// - Reference counting (atomic shared_ptr):
///   o Pros: automatic reclamation, thread-anonymous, independent of
///     support for thread local data, immune to deadlock.
///   o Cons: high reader (and writer) overhead, high reader (and
///     writer) contention.
///   o When to use: When thread local support is lacking and deadlock
///     can be a problem, or automatic reclamation is needed.
/// - Read-copy-update (RCU):
///   o Pros: simple, fast, scalable.
///   o Cons: sensitive to blocking
///   o When to use: When speed and scalability are important and
///     objects do not need to be protected while blocking.
///
/// Hazard Pointers vs RCU
/// ----------------------
/// - The differences between hazard pointers and RCU boil down to
///   that hazard pointers protect specific objects, whereas RCU
///   sections protect all protectable objects.
/// - Both have comparably low overheads for protection (i.e. reading
///   or traversal) in the order of low nanoseconds.
/// - Both support effectively perfect scalability of object
///   protection by read-only operations (barring other factors).
/// - Both rely on thread local data for performance.
/// - Hazard pointers can protect objects while blocking
///   indefinitely. Hazard pointers only prevent the reclamation of
///   the objects they are protecting.
/// - RCU sections do not allow indefinite blocking, because RCU
///   prevents the reclamation of all protectable objects, which
///   otherwise would lead to deadlock and/or running out of memory.
/// - Hazard pointers can support end-to-end lock-free operations,
///   including updates (provided lock-free allocator), regardless of
///   thread delays and scheduling constraints.
/// - RCU can support wait-free read operations, but reclamation of
///   unbounded objects can be delayed for as long as a single thread
///   is delayed.
/// - The number of unreclaimed objects is bounded when protected by
///   hazard pointers, but is unbounded when protected by RCU.
/// - RCU is simpler to use than hazard pointers (except for the
///   blocking and deadlock issues mentioned above). Hazard pointers
///   need to identify protected objects, whereas RCU does not need to
///   because it protects all protectable objects.
/// - Both can protect linked structures. Hazard pointers needs
///   additional link counting with low or moderate overhead for
///   update operations, and no overhead for readers. RCU protects
///   protects linked structures automatically, because it protects
///   everything.
///
/// Differences from the Standard Proposal
/// --------------------------------------
/// - The latest standard proposal is in wg21.link/p0566.
/// - This library's API differs from the standard proposal because:
///   (a) the standard proposal is changing based on committee
///   feedback, and (b) this library provides additional
///   fast-evolving features based on usage experience that do not
///   have corressponding proposed standard wording.
/// - The main differences are:
///   o This library uses an extra atomic template parameter for
///     testing and debugging.
///   o This library does not support a custom polymorphic allocator
///     (C++17) parameter for the hazptr_domain constructor, until
///     such support becomes widely available.
///   o The construction of empty and non-empty hazptr_holder-s are
///     reversed. This library will conform eventually.
///   o hazptr_holder member functions get_protected and reset are
///     called protect and reset_protected, respectively, in the
///     latest proposal. Will conform eventually.
///   o hazptr_array and hazptr_local are not part of the standard
///     proposal.
///   o Link counting support and protection of linked structures is
///     not part of the current standard proposal.
