/*
 * Copyright (c) 2010 Wayne Meissner
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

#ifndef RBFFI_THREAD_H
#define	RBFFI_THREAD_H

#include <stdbool.h>
#include <ruby.h>
#include "extconf.h"

#ifdef	__cplusplus
extern "C" {
#endif


#ifdef _WIN32
# include <windows.h>
#else
# include <pthread.h>
#endif

typedef struct {
#ifdef _WIN32
    DWORD id;
#else
    pthread_t id;
#endif
    bool valid;
    bool has_gvl;
    VALUE exc;
} rbffi_thread_t;

typedef struct rbffi_frame {
#ifndef _WIN32
    struct thread_data* td;
#endif
    struct rbffi_frame* prev;
    VALUE exc;
} rbffi_frame_t;

rbffi_frame_t* rbffi_frame_current(void);
void rbffi_frame_push(rbffi_frame_t* frame);
void rbffi_frame_pop(rbffi_frame_t* frame);

#ifdef	__cplusplus
}
#endif

#endif	/* RBFFI_THREAD_H */

