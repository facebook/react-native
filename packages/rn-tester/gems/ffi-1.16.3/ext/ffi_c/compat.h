/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 *
 * Copyright (c) 2008-2013, Ruby FFI project contributors
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Ruby FFI project nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef RBFFI_COMPAT_H
#define RBFFI_COMPAT_H

#include <ruby.h>

#ifndef roundup
#  define roundup(x, y)   ((((x)+((y)-1))/(y))*(y))
#endif

#ifdef __GNUC__
#  define likely(x) __builtin_expect((x), 1)
#  define unlikely(x) __builtin_expect((x), 0)
#else
#  define likely(x) (x)
#  define unlikely(x) (x)
#endif

#ifdef _MSC_VER
#define ffi_type_longdouble ffi_type_double
#endif

#ifndef MAX
#  define MAX(a, b) ((a) < (b) ? (b) : (a))
#endif
#ifndef MIN
#  define MIN(a, b) ((a) < (b) ? (a) : (b))
#endif



/* For compatibility with ruby < 2.7 */
#ifdef HAVE_RB_GC_MARK_MOVABLE
#define ffi_compact_callback(x) .dcompact = (x),
#define ffi_gc_location(x) x = rb_gc_location(x)
#else
#define rb_gc_mark_movable(x) rb_gc_mark(x)
#define ffi_compact_callback(x)
#define ffi_gc_location(x)
#endif


/* For compatibility with ruby < 3.0 */
#ifndef RUBY_TYPED_FROZEN_SHAREABLE
#define FFI_RUBY_TYPED_FROZEN_SHAREABLE 0
#else
#define FFI_RUBY_TYPED_FROZEN_SHAREABLE RUBY_TYPED_FROZEN_SHAREABLE
#endif

#ifndef HAVE_RB_EXT_RACTOR_SAFE
#define rb_ractor_make_shareable(self) rb_obj_freeze(self);
#endif

#endif /* RBFFI_COMPAT_H */
