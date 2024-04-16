/*
 * Copyright (c) 2008-2010 Wayne Meissner
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

#ifndef _LIBRARY_H
#define	_LIBRARY_H

#ifdef	__cplusplus
extern "C" {
#endif

/* if these aren't defined (eg. windows), we need sensible defaults */
#ifndef RTLD_LAZY
#define RTLD_LAZY 1
#endif

#ifndef RTLD_NOW
#define RTLD_NOW 2
#endif

#ifndef RTLD_LOCAL
#define RTLD_LOCAL 4
#endif

#ifndef RTLD_GLOBAL
#define RTLD_GLOBAL 8
#endif

/* If these aren't defined, they're not supported so define as 0 */
#ifndef RTLD_NOLOAD
#define RTLD_NOLOAD 0
#endif

#ifndef RTLD_NODELETE
#define RTLD_NODELETE 0
#endif

#ifndef RTLD_FIRST
#define RTLD_FIRST 0
#endif

#ifndef RTLD_DEEPBIND
#define RTLD_DEEPBIND 0
#endif

#ifndef RTLD_MEMBER
#define RTLD_MEMBER 0
#endif

/* convenience */
#ifndef RTLD_BINDING_MASK
#define RTLD_BINDING_MASK (RTLD_LAZY | RTLD_NOW)
#endif

#ifndef RTLD_LOCATION_MASK
#define RTLD_LOCATION_MASK (RTLD_LOCAL | RTLD_GLOBAL)
#endif

#ifndef RTLD_ALL_MASK
#define RTLD_ALL_MASK (RTLD_BINDING_MASK | RTLD_LOCATION_MASK | RTLD_NOLOAD | RTLD_NODELETE | RTLD_FIRST | RTLD_DEEPBIND | RTLD_MEMBER)
#endif

typedef struct Library {
    void* handle;
} Library;

extern void rbffi_DynamicLibrary_Init(VALUE ffiModule);

#ifdef	__cplusplus
}
#endif

#endif	/* _LIBRARY_H */

