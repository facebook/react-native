/*
 * Copyright (c) 2009, 2010 Wayne Meissner
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

#ifndef _MSC_VER
#include <sys/param.h>
#endif
#include <sys/types.h>
#if defined(__CYGWIN__) || !defined(_WIN32)
#  include <sys/mman.h>
#endif
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#if defined(__CYGWIN__) || !defined(_WIN32)
#  include <unistd.h>
#else
#  include <winsock2.h>
#  define _WINSOCKAPI_
#  include <windows.h>
#endif
#include <errno.h>
#include <ruby.h>

#include <ffi.h>
#include "rbffi.h"
#include "compat.h"

#include "Function.h"
#include "Types.h"
#include "Type.h"
#include "LastError.h"
#include "Call.h"

#include "ClosurePool.h"

#ifndef roundup
#  define roundup(x, y)   ((((x)+((y)-1))/(y))*(y))
#endif

typedef struct Memory {
    void* code;
    void* data;
    struct Memory* next;
} Memory;

struct ClosurePool_ {
    void* ctx;
    int closureSize;
    bool (*prep)(void* ctx, void *code, Closure* closure, char* errbuf, size_t errbufsize);
    struct Memory* blocks; /* Keeps track of all the allocated memory for this pool */
    Closure* list;
    long refcnt;
};

static long pageSize;

static void* allocatePage(void);
static bool freePage(void *);
static bool protectPage(void *);

ClosurePool*
rbffi_ClosurePool_New(int closureSize,
        bool (*prep)(void* ctx, void *code, Closure* closure, char* errbuf, size_t errbufsize),
        void* ctx)
{
    ClosurePool* pool;

    pool = xcalloc(1, sizeof(*pool));
    pool->closureSize = closureSize;
    pool->ctx = ctx;
    pool->prep = prep;
    pool->refcnt = 1;

    return pool;
}

void
cleanup_closure_pool(ClosurePool* pool)
{
    Memory* memory;

    for (memory = pool->blocks; memory != NULL; ) {
        Memory* next = memory->next;
#if !USE_FFI_ALLOC
        freePage(memory->code);
#else
        ffi_closure_free(memory->code);
#endif
        free(memory->data);
        free(memory);
        memory = next;
    }
    xfree(pool);
}

void
rbffi_ClosurePool_Free(ClosurePool* pool)
{
    if (pool != NULL) {
        long refcnt = --(pool->refcnt);
        if (refcnt == 0) {
            cleanup_closure_pool(pool);
        }
    }
}

#if !USE_FFI_ALLOC

Closure*
rbffi_Closure_Alloc(ClosurePool* pool)
{
    Closure *list = NULL;
    Memory* block = NULL;
    void *code = NULL;
    char errmsg[256];
    int nclosures;
    long trampolineSize;
    int i;

    if (pool->list != NULL) {
        Closure* closure = pool->list;
        pool->list = pool->list->next;
        pool->refcnt++;

        return closure;
    }

    trampolineSize = roundup(pool->closureSize, 8);
    nclosures = (int) (pageSize / trampolineSize);
    block = calloc(1, sizeof(*block));
    list = calloc(nclosures, sizeof(*list));
    code = allocatePage();

    if (block == NULL || list == NULL || code == NULL) {
        snprintf(errmsg, sizeof(errmsg), "failed to allocate a page. errno=%d (%s)", errno, strerror(errno));
        goto error;
    }

    for (i = 0; i < nclosures; ++i) {
        Closure* closure = &list[i];
        closure->next = &list[i + 1];
        closure->pool = pool;
        closure->code = ((char *)code + (i * trampolineSize));
        closure->pcl  = closure->code;

        if (!(*pool->prep)(pool->ctx, closure->code, closure, errmsg, sizeof(errmsg))) {
            goto error;
        }
    }

    if (!protectPage(code)) {
        goto error;
    }

    /* Track the allocated page + Closure memory area */
    block->data = list;
    block->code = code;
    block->next = pool->blocks;
    pool->blocks = block;

    /* Thread the new block onto the free list, apart from the first one. */
    list[nclosures - 1].next = pool->list;
    pool->list = list->next;
    pool->refcnt++;

    /* Use the first one as the new handle */
    return list;

error:
    free(block);
    free(list);
    if (code != NULL) {
        freePage(code);
    }


    rb_raise(rb_eRuntimeError, "%s", errmsg);
    return NULL;
}

#else

Closure*
rbffi_Closure_Alloc(ClosurePool* pool)
{
    Closure *closure = NULL;
    Memory* block = NULL;
    void *code = NULL;
    void *pcl = NULL;
    char errmsg[256];

    block = calloc(1, sizeof(*block));
    closure = calloc(1, sizeof(*closure));
    pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);

    if (block == NULL || closure == NULL || pcl == NULL) {
        snprintf(errmsg, sizeof(errmsg), "failed to allocate a page. errno=%d (%s)", errno, strerror(errno));
        goto error;
    }

    closure->pool = pool;
    closure->code = code;
    closure->pcl = pcl;

    if (!(*pool->prep)(pool->ctx, closure->code, closure, errmsg, sizeof(errmsg))) {
        goto error;
    }

    /* Track the allocated page + Closure memory area */
    block->data = closure;
    block->code = pcl;
    pool->blocks = block;

    /* Thread the new block onto the free list, apart from the first one. */
    pool->refcnt++;

    return closure;

error:
    free(block);
    free(closure);
    if (pcl != NULL) {
        ffi_closure_free(pcl);
    }

    rb_raise(rb_eRuntimeError, "%s", errmsg);
    return NULL;
}

#endif /* !USE_FFI_ALLOC */

void
rbffi_Closure_Free(Closure* closure)
{
    if (closure != NULL) {
        ClosurePool* pool = closure->pool;
        long refcnt;
        /* Just push it on the front of the free list */
        closure->next = pool->list;
        pool->list = closure;
        refcnt = --(pool->refcnt);
        if (refcnt == 0) {
            cleanup_closure_pool(pool);
        }
    }
}

void*
rbffi_Closure_CodeAddress(Closure* handle)
{
    return handle->code;
}


static long
getPageSize()
{
#if !defined(__CYGWIN__) && (defined(_WIN32) || defined(__WIN32__))
    SYSTEM_INFO si;
    GetSystemInfo(&si);
    return si.dwPageSize;
#else
    return sysconf(_SC_PAGESIZE);
#endif
}

#if !USE_FFI_ALLOC

static void*
allocatePage(void)
{
#if !defined(__CYGWIN__) && (defined(_WIN32) || defined(__WIN32__))
    return VirtualAlloc(NULL, pageSize, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
#else
    void *page = mmap(NULL, pageSize, PROT_READ | PROT_WRITE, MAP_ANON | MAP_PRIVATE, -1, 0);
    return (page != (void *) -1) ? page : NULL;
#endif
}

static bool
freePage(void *addr)
{
#if !defined(__CYGWIN__) && (defined(_WIN32) || defined(__WIN32__))
    return VirtualFree(addr, 0, MEM_RELEASE);
#else
    return munmap(addr, pageSize) == 0;
#endif
}

static bool
protectPage(void* page)
{
#if !defined(__CYGWIN__) && (defined(_WIN32) || defined(__WIN32__))
    DWORD oldProtect;
    return VirtualProtect(page, pageSize, PAGE_EXECUTE_READ, &oldProtect);
#else
    return mprotect(page, pageSize, PROT_READ | PROT_EXEC) == 0;
#endif
}

#endif /* !USE_FFI_ALLOC */

void
rbffi_ClosurePool_Init(VALUE module)
{
    pageSize = getPageSize();
}

