/*
 * Copyright (c) 2009-2011 Wayne Meissner
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

#ifndef _MSC_VER
#include <sys/param.h>
#endif
#include <sys/types.h>
#ifndef _WIN32
# include <sys/mman.h>
# include <unistd.h>
#endif

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <ruby.h>
#include <ruby/thread.h>

#if HAVE_RB_EXT_RACTOR_SAFE
#include <ruby/ractor.h>
#endif

#include <ffi.h>
#if defined(HAVE_NATIVETHREAD) && !defined(_WIN32)
#include <pthread.h>
#endif
#include <fcntl.h>

#include "rbffi.h"
#include "compat.h"

#include "AbstractMemory.h"
#include "Pointer.h"
#include "Struct.h"
#include "Platform.h"
#include "Type.h"
#include "LastError.h"
#include "Call.h"
#include "ClosurePool.h"
#include "MappedType.h"
#include "Thread.h"
#include "LongDouble.h"
#include "MethodHandle.h"
#include "Function.h"

#define DEFER_ASYNC_CALLBACK 1

struct async_cb_dispatcher;
typedef struct Function_ {
    Pointer base;
    FunctionType* info;
    MethodHandle* methodHandle;
    bool autorelease;
    Closure* closure;
    VALUE rbProc;
    VALUE rbFunctionInfo;
#if defined(DEFER_ASYNC_CALLBACK)
    struct async_cb_dispatcher *dispatcher;
#endif
} Function;

static void function_mark(void *data);
static void function_compact(void *data);
static void function_free(void *data);
static size_t function_memsize(const void *data);
static VALUE function_init(VALUE self, VALUE rbFunctionInfo, VALUE rbProc);
static void callback_invoke(ffi_cif* cif, void* retval, void** parameters, void* user_data);
static bool callback_prep(void* ctx, void* code, Closure* closure, char* errmsg, size_t errmsgsize);
static void* callback_with_gvl(void* data);
static VALUE invoke_callback(VALUE data);
static VALUE save_callback_exception(VALUE data, VALUE exc);

#if defined(DEFER_ASYNC_CALLBACK)
static VALUE async_cb_event(void *);
static VALUE async_cb_call(void *);
#endif

extern int ruby_thread_has_gvl_p(void);
extern int ruby_native_thread_p(void);

static const rb_data_type_t function_data_type = {
    .wrap_struct_name = "FFI::Function",
    .function = {
        .dmark = function_mark,
        .dfree = function_free,
        .dsize = function_memsize,
        ffi_compact_callback( function_compact )
    },
    .parent = &rbffi_pointer_data_type,
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

VALUE rbffi_FunctionClass = Qnil;

static ID id_call = 0, id_to_native = 0, id_from_native = 0, id_cbtable = 0, id_cb_ref = 0;

struct gvl_callback {
    Closure* closure;
    void*    retval;
    void**   parameters;
    bool done;
    rbffi_frame_t *frame;
#if defined(DEFER_ASYNC_CALLBACK)
    struct async_cb_dispatcher *dispatcher;
    struct gvl_callback* next;

    /* Signal when the callback has finished and retval is set */
# ifndef _WIN32
    pthread_cond_t async_cond;
    pthread_mutex_t async_mutex;
# else
    HANDLE async_event;
# endif
#endif
};


#if defined(DEFER_ASYNC_CALLBACK)
struct async_cb_dispatcher {
    /* the Ractor-local dispatcher thread */
    VALUE thread;

    /* single linked list of pending callbacks */
    struct gvl_callback* async_cb_list;

    /* Signal new entries in async_cb_list */
# ifndef _WIN32
    pthread_mutex_t async_cb_mutex;
    pthread_cond_t async_cb_cond;
# else
    HANDLE async_cb_cond;
    CRITICAL_SECTION async_cb_lock;
# endif
};

#if HAVE_RB_EXT_RACTOR_SAFE
static void
async_cb_dispatcher_mark(void *ptr)
{
    struct async_cb_dispatcher *ctx = (struct async_cb_dispatcher *)ptr;
    if (ctx) {
        rb_gc_mark(ctx->thread);
    }
}

static void
async_cb_dispatcher_free(void *ptr)
{
    struct async_cb_dispatcher *ctx = (struct async_cb_dispatcher *)ptr;
    if (ctx) {
        xfree(ctx);
    }
}

struct rb_ractor_local_storage_type async_cb_dispatcher_key_type = {
    async_cb_dispatcher_mark,
    async_cb_dispatcher_free,
};

static rb_ractor_local_key_t async_cb_dispatcher_key;

static struct async_cb_dispatcher *
async_cb_dispatcher_get(void)
{
    struct async_cb_dispatcher *ctx = (struct async_cb_dispatcher *)rb_ractor_local_storage_ptr(async_cb_dispatcher_key);
    return ctx;
}

static void
async_cb_dispatcher_set(struct async_cb_dispatcher *ctx)
{
    rb_ractor_local_storage_ptr_set(async_cb_dispatcher_key, ctx);
}
#else
// for ruby 2.x
static struct async_cb_dispatcher *async_cb_dispatcher = NULL;

static struct async_cb_dispatcher *
async_cb_dispatcher_get(void)
{
    return async_cb_dispatcher;
}

static void
async_cb_dispatcher_set(struct async_cb_dispatcher *ctx)
{
    async_cb_dispatcher = ctx;
}
#endif
#endif

static VALUE
function_allocate(VALUE klass)
{
    Function *fn;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, Function, &function_data_type, fn);

    fn->base.memory.flags = MEM_RD;
    RB_OBJ_WRITE(obj, &fn->base.rbParent, Qnil);
    RB_OBJ_WRITE(obj, &fn->rbProc, Qnil);
    RB_OBJ_WRITE(obj, &fn->rbFunctionInfo, Qnil);
    fn->autorelease = true;

    return obj;
}

static void
function_mark(void *data)
{
    Function *fn = (Function *)data;
    rb_gc_mark_movable(fn->base.rbParent);
    rb_gc_mark_movable(fn->rbProc);
    rb_gc_mark_movable(fn->rbFunctionInfo);
}

static void
function_compact(void *data)
{
    Function *fn = (Function *)data;
    ffi_gc_location(fn->base.rbParent);
    ffi_gc_location(fn->rbProc);
    ffi_gc_location(fn->rbFunctionInfo);
}

static void
function_free(void *data)
{
    Function *fn = (Function *)data;
    if (fn->methodHandle != NULL) {
        rbffi_MethodHandle_Free(fn->methodHandle);
    }

    if (fn->closure != NULL && fn->autorelease) {
        rbffi_Closure_Free(fn->closure);
    }

    xfree(fn);
}

static size_t
function_memsize(const void *data)
{
    const Function *fn = (const Function *)data;
    size_t memsize = sizeof(Function);

    // Would be nice to better account for MethodHandle and Closure too.
    if (fn->closure) {
        memsize += sizeof(Closure);
    }

    return memsize;
}

/*
 * @param [Type, Symbol] return_type return type for the function
 * @param [Array<Type, Symbol>] param_types array of parameters types
 * @param [Hash] options see {FFI::FunctionType} for available options
 * @return [self]
 * A new Function instance.
 *
 * Define a function from a Proc or a block.
 *
 * @overload initialize(return_type, param_types, options = {}) { |i| ... }
 *  @yieldparam i parameters for the function
 * @overload initialize(return_type, param_types, proc, options = {})
 *  @param [Proc] proc
 */
static VALUE
function_initialize(int argc, VALUE* argv, VALUE self)
{

    VALUE rbReturnType = Qnil, rbParamTypes = Qnil, rbProc = Qnil, rbOptions = Qnil;
    VALUE rbFunctionInfo = Qnil;
    VALUE infoArgv[3];
    int nargs;

    nargs = rb_scan_args(argc, argv, "22", &rbReturnType, &rbParamTypes, &rbProc, &rbOptions);

    /*
     * Callback with block,
     * e.g. Function.new(:int, [ :int ]) { |i| blah }
     * or   Function.new(:int, [ :int ], { :convention => :stdcall }) { |i| blah }
     */
    if (rb_block_given_p()) {
        if (nargs > 3) {
            rb_raise(rb_eArgError, "cannot create function with both proc/address and block");
        }
        rbOptions = rbProc;
        rbProc = rb_block_proc();
    } else {
        /* Callback with proc, or Function with address
         * e.g. Function.new(:int, [ :int ], Proc.new { |i| })
         *      Function.new(:int, [ :int ], Proc.new { |i| }, { :convention => :stdcall })
         *      Function.new(:int, [ :int ], addr)
         *      Function.new(:int, [ :int ], addr, { :convention => :stdcall })
         */
    }

    infoArgv[0] = rbReturnType;
    infoArgv[1] = rbParamTypes;
    infoArgv[2] = rbOptions;
    rbFunctionInfo = rb_class_new_instance(rbOptions != Qnil ? 3 : 2, infoArgv, rbffi_FunctionTypeClass);

    function_init(self, rbFunctionInfo, rbProc);

    return self;
}

/*
 * call-seq: initialize_copy(other)
 * @return [nil]
 * DO NOT CALL THIS METHOD
 */
static VALUE
function_initialize_copy(VALUE self, VALUE other)
{
    rb_raise(rb_eRuntimeError, "cannot duplicate function instances");
    return Qnil;
}

VALUE
rbffi_Function_NewInstance(VALUE rbFunctionInfo, VALUE rbProc)
{
    return function_init(function_allocate(rbffi_FunctionClass), rbFunctionInfo, rbProc);
}

VALUE
rbffi_Function_ForProc(VALUE rbFunctionInfo, VALUE proc)
{
    VALUE callback, cbref, cbTable;

    cbref = RTEST(rb_ivar_defined(proc, id_cb_ref)) ? rb_ivar_get(proc, id_cb_ref) : Qnil;
    /* If the first callback reference has the same function function signature, use it */
    if (cbref != Qnil && CLASS_OF(cbref) == rbffi_FunctionClass) {
        Function* fp;
        TypedData_Get_Struct(cbref, Function, &function_data_type, fp);
        if (fp->rbFunctionInfo == rbFunctionInfo) {
            return cbref;
        }
    }

    cbTable = RTEST(rb_ivar_defined(proc, id_cbtable)) ? rb_ivar_get(proc, id_cbtable) : Qnil;
    if (cbTable != Qnil && (callback = rb_hash_aref(cbTable, rbFunctionInfo)) != Qnil) {
        return callback;
    }

    /* No existing function for the proc with that signature, create a new one and cache it */
    callback = rbffi_Function_NewInstance(rbFunctionInfo, proc);
    if (cbref == Qnil) {
        /* If there is no other cb already cached for this proc, we can use the ivar slot */
        rb_ivar_set(proc, id_cb_ref, callback);
    } else {
        /* The proc instance has been used as more than one type of callback, store extras in a hash */
        if(cbTable == Qnil) {
          cbTable = rb_hash_new();
          rb_ivar_set(proc, id_cbtable, cbTable);
        }
        rb_hash_aset(cbTable, rbFunctionInfo, callback);
    }

    return callback;
}

#if !defined(_WIN32) && defined(DEFER_ASYNC_CALLBACK)
static void
after_fork_callback(void)
{
    /* Ensure that a new dispatcher thread is started in a forked process */
    async_cb_dispatcher_set(NULL);
}
#endif

static VALUE
function_init(VALUE self, VALUE rbFunctionInfo, VALUE rbProc)
{
    Function* fn = NULL;

    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    RB_OBJ_WRITE(self, &fn->rbFunctionInfo, rbFunctionInfo);

    TypedData_Get_Struct(fn->rbFunctionInfo, FunctionType, &rbffi_fntype_data_type, fn->info);

    if (rb_obj_is_kind_of(rbProc, rbffi_PointerClass)) {
        Pointer* orig;
        TypedData_Get_Struct(rbProc, Pointer, &rbffi_pointer_data_type, orig);
        fn->base.memory = orig->memory;
        RB_OBJ_WRITE(self, &fn->base.rbParent, rbProc);

    } else if (rb_obj_is_kind_of(rbProc, rb_cProc) || rb_respond_to(rbProc, id_call)) {
        if (fn->info->closurePool == NULL) {
            fn->info->closurePool = rbffi_ClosurePool_New(sizeof(ffi_closure), callback_prep, fn->info);
            if (fn->info->closurePool == NULL) {
                rb_raise(rb_eNoMemError, "failed to create closure pool");
            }
        }

#if defined(DEFER_ASYNC_CALLBACK)
        {
            struct async_cb_dispatcher *ctx = async_cb_dispatcher_get();
            if (ctx == NULL) {
                ctx = (struct async_cb_dispatcher*)ALLOC(struct async_cb_dispatcher);
                ctx->async_cb_list = NULL;

#if !defined(_WIN32)
                pthread_mutex_init(&ctx->async_cb_mutex, NULL);
                pthread_cond_init(&ctx->async_cb_cond, NULL);
                if( pthread_atfork(NULL, NULL, after_fork_callback) ){
                    rb_warn("FFI: unable to register fork callback");
                }
#else
                InitializeCriticalSection(&ctx->async_cb_lock);
                ctx->async_cb_cond = CreateEvent(NULL, FALSE, FALSE, NULL);
#endif
                ctx->thread = rb_thread_create(async_cb_event, ctx);

                /* Name thread, for better debugging */
                rb_funcall(ctx->thread, rb_intern("name="), 1, rb_str_new2("FFI Callback Dispatcher"));

                async_cb_dispatcher_set(ctx);
            }
            fn->dispatcher = ctx;
        }
#endif

        fn->closure = rbffi_Closure_Alloc(fn->info->closurePool);
        fn->closure->info = fn;
        fn->base.memory.address = fn->closure->code;
        fn->base.memory.size = sizeof(*fn->closure);
        fn->autorelease = true;

    } else {
        rb_raise(rb_eTypeError, "wrong argument type %s, expected pointer or proc",
                rb_obj_classname(rbProc));
    }

    RB_OBJ_WRITE(self, &fn->rbProc, rbProc);

    return self;
}

/*
 * call-seq: call(*args)
 * @param [Array] args function arguments
 * @return [FFI::Type]
 * Call the function
 */
static VALUE
function_call(int argc, VALUE* argv, VALUE self)
{
    Function* fn;

    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    return (*fn->info->invoke)(argc, argv, fn->base.memory.address, fn->info);
}

/*
 * call-seq: attach(m, name)
 * @param [Module] m
 * @param [String] name
 * @return [self]
 * Attach a Function to the Module +m+ as +name+.
 */
static VALUE
function_attach(VALUE self, VALUE module, VALUE name)
{
    Function* fn;

    StringValue(name);
    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    if (fn->info->parameterCount == -1) {
        rb_raise(rb_eRuntimeError, "cannot attach variadic functions");
        return Qnil;
    }

    if (!rb_obj_is_kind_of(module, rb_cModule)) {
        rb_raise(rb_eRuntimeError, "trying to attach function to non-module");
        return Qnil;
    }

    if (fn->methodHandle == NULL) {
        fn->methodHandle = rbffi_MethodHandle_Alloc(fn->info, fn->base.memory.address);
    }

    rb_define_singleton_method(module, StringValueCStr(name),
            rbffi_MethodHandle_CodeAddress(fn->methodHandle), -1);


    rb_define_method(module, StringValueCStr(name),
            rbffi_MethodHandle_CodeAddress(fn->methodHandle), -1);

    return self;
}

/*
 * call-seq: autorelease = autorelease
 * @param [Boolean] autorelease
 * @return [self]
 * Set +autorelease+ attribute (See {Pointer}).
 */
static VALUE
function_set_autorelease(VALUE self, VALUE autorelease)
{
    Function* fn;

    rb_check_frozen(self);
    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    fn->autorelease = RTEST(autorelease);

    return self;
}

static VALUE
function_autorelease_p(VALUE self)
{
    Function* fn;

    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    return fn->autorelease ? Qtrue : Qfalse;
}

static VALUE
function_type(VALUE self)
{
    Function* fn;

    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    return fn->rbFunctionInfo;
}

/*
 * call-seq: free
 * @return [self]
 * Free memory allocated by Function.
 */
static VALUE
function_release(VALUE self)
{
    Function* fn;

    TypedData_Get_Struct(self, Function, &function_data_type, fn);

    if (fn->closure == NULL) {
        rb_raise(rb_eRuntimeError, "cannot free function which was not allocated");
    }

    rbffi_Closure_Free(fn->closure);
    fn->closure = NULL;

    return self;
}

static void
callback_invoke(ffi_cif* cif, void* retval, void** parameters, void* user_data)
{
    Function* fn;
    struct gvl_callback cb = { 0 };

    cb.closure = (Closure *) user_data;
    cb.retval = retval;
    cb.parameters = parameters;
    cb.done = false;
    cb.frame = rbffi_frame_current();
    fn = (Function *) cb.closure->info;

    if (cb.frame != NULL) cb.frame->exc = Qnil;

    if (ruby_native_thread_p()) {
      if(ruby_thread_has_gvl_p()) {
        callback_with_gvl(&cb);
      } else {
        rb_thread_call_with_gvl(callback_with_gvl, &cb);
      }
#if defined(DEFER_ASYNC_CALLBACK) && !defined(_WIN32)
    } else {
        bool empty = false;
        struct async_cb_dispatcher *ctx = fn->dispatcher;

        pthread_mutex_init(&cb.async_mutex, NULL);
        pthread_cond_init(&cb.async_cond, NULL);

        /* Now signal the async callback dispatcher thread */
        pthread_mutex_lock(&ctx->async_cb_mutex);
        empty = ctx->async_cb_list == NULL;
        cb.next = ctx->async_cb_list;
        ctx->async_cb_list = &cb;

        pthread_cond_signal(&ctx->async_cb_cond);
        pthread_mutex_unlock(&ctx->async_cb_mutex);

        /* Wait for the thread executing the ruby callback to signal it is done */
        pthread_mutex_lock(&cb.async_mutex);
        while (!cb.done) {
            pthread_cond_wait(&cb.async_cond, &cb.async_mutex);
        }
        pthread_mutex_unlock(&cb.async_mutex);
        pthread_cond_destroy(&cb.async_cond);
        pthread_mutex_destroy(&cb.async_mutex);

#elif defined(DEFER_ASYNC_CALLBACK) && defined(_WIN32)
    } else {
        bool empty = false;
        struct async_cb_dispatcher *ctx = fn->dispatcher;

        cb.async_event = CreateEvent(NULL, FALSE, FALSE, NULL);

        /* Now signal the async callback dispatcher thread */
        EnterCriticalSection(&ctx->async_cb_lock);
        empty = ctx->async_cb_list == NULL;
        cb.next = ctx->async_cb_list;
        ctx->async_cb_list = &cb;
        LeaveCriticalSection(&ctx->async_cb_lock);

        SetEvent(ctx->async_cb_cond);

        /* Wait for the thread executing the ruby callback to signal it is done */
        WaitForSingleObject(cb.async_event, INFINITE);
        CloseHandle(cb.async_event);
#endif
    }
}

#if defined(DEFER_ASYNC_CALLBACK)
struct async_wait {
    struct async_cb_dispatcher *dispatcher;
    void* cb;
    bool stop;
};

static void * async_cb_wait(void *);
static void async_cb_stop(void *);

static VALUE
async_cb_event(void* ptr)
{
    struct async_cb_dispatcher *ctx = (struct async_cb_dispatcher *)ptr;
    struct async_wait w = { ctx };

    w.stop = false;
    while (!w.stop) {
        rb_thread_call_without_gvl(async_cb_wait, &w, async_cb_stop, &w);
        if (w.cb != NULL) {
            /* Start up a new ruby thread to run the ruby callback */
            VALUE new_thread = rb_thread_create(async_cb_call, w.cb);
            /* Name thread, for better debugging */
            rb_funcall(new_thread, rb_intern("name="), 1, rb_str_new2("FFI Callback Runner"));
        }
    }

    return Qnil;
}

#ifdef _WIN32
static void *
async_cb_wait(void *data)
{
    struct async_wait* w = (struct async_wait *) data;
    struct async_cb_dispatcher *ctx = w->dispatcher;

    w->cb = NULL;

    EnterCriticalSection(&ctx->async_cb_lock);

    while (!w->stop && ctx->async_cb_list == NULL) {
        LeaveCriticalSection(&ctx->async_cb_lock);
        WaitForSingleObject(ctx->async_cb_cond, INFINITE);
        EnterCriticalSection(&ctx->async_cb_lock);
    }

    if (ctx->async_cb_list != NULL) {
        w->cb = ctx->async_cb_list;
        ctx->async_cb_list = ctx->async_cb_list->next;
    }

    LeaveCriticalSection(&ctx->async_cb_lock);

    return NULL;
}

static void
async_cb_stop(void *data)
{
    struct async_wait* w = (struct async_wait *) data;
    struct async_cb_dispatcher *ctx = w->dispatcher;

    EnterCriticalSection(&ctx->async_cb_lock);
    w->stop = true;
    LeaveCriticalSection(&ctx->async_cb_lock);
    SetEvent(ctx->async_cb_cond);
}

#else
static void *
async_cb_wait(void *data)
{
    struct async_wait* w = (struct async_wait *) data;
    struct async_cb_dispatcher *ctx = w->dispatcher;

    w->cb = NULL;

    pthread_mutex_lock(&ctx->async_cb_mutex);

    while (!w->stop && ctx->async_cb_list == NULL) {
        pthread_cond_wait(&ctx->async_cb_cond, &ctx->async_cb_mutex);
    }

    if (ctx->async_cb_list != NULL) {
        w->cb = ctx->async_cb_list;
        ctx->async_cb_list = ctx->async_cb_list->next;
    }

    pthread_mutex_unlock(&ctx->async_cb_mutex);

    return NULL;
}

static void
async_cb_stop(void *data)
{
    struct async_wait* w = (struct async_wait *) data;
    struct async_cb_dispatcher *ctx = w->dispatcher;

    pthread_mutex_lock(&ctx->async_cb_mutex);
    w->stop = true;
    pthread_cond_signal(&ctx->async_cb_cond);
    pthread_mutex_unlock(&ctx->async_cb_mutex);
}
#endif

static VALUE
async_cb_call(void *data)
{
    struct gvl_callback* cb = (struct gvl_callback *) data;

    callback_with_gvl(data);

    /* Signal the original native thread that the ruby code has completed */
#ifdef _WIN32
    SetEvent(cb->async_event);
#else
    pthread_mutex_lock(&cb->async_mutex);
    cb->done = true;
    pthread_cond_signal(&cb->async_cond);
    pthread_mutex_unlock(&cb->async_mutex);
#endif

    return Qnil;
}

#endif

static void *
callback_with_gvl(void* data)
{
    rb_rescue2(invoke_callback, (VALUE) data, save_callback_exception, (VALUE) data, rb_eException, (VALUE) 0);
    return NULL;
}

static VALUE
invoke_callback(VALUE data)
{
    struct gvl_callback* cb = (struct gvl_callback *) data;

    Function* fn = (Function *) cb->closure->info;
    FunctionType *cbInfo = fn->info;
    Type* returnType = cbInfo->returnType;
    void* retval = cb->retval;
    void** parameters = cb->parameters;
    VALUE* rbParams;
    VALUE rbReturnType = cbInfo->rbReturnType;
    VALUE rbReturnValue;
    int i;

    rbParams = ALLOCA_N(VALUE, cbInfo->parameterCount);
    for (i = 0; i < cbInfo->parameterCount; ++i) {
        VALUE param;
        Type* paramType = cbInfo->parameterTypes[i];
        VALUE rbParamType = rb_ary_entry(cbInfo->rbParameterTypes, i);

        if (unlikely(paramType->nativeType == NATIVE_MAPPED)) {
            rbParamType = ((MappedType *) paramType)->rbType;
            paramType = ((MappedType *) paramType)->type;
        }

        switch (paramType->nativeType) {
            case NATIVE_INT8:
                param = INT2NUM(*(int8_t *) parameters[i]);
                break;
            case NATIVE_UINT8:
                param = UINT2NUM(*(uint8_t *) parameters[i]);
                break;
            case NATIVE_INT16:
                param = INT2NUM(*(int16_t *) parameters[i]);
                break;
            case NATIVE_UINT16:
                param = UINT2NUM(*(uint16_t *) parameters[i]);
                break;
            case NATIVE_INT32:
                param = INT2NUM(*(int32_t *) parameters[i]);
                break;
            case NATIVE_UINT32:
                param = UINT2NUM(*(uint32_t *) parameters[i]);
                break;
            case NATIVE_INT64:
                param = LL2NUM(*(int64_t *) parameters[i]);
                break;
            case NATIVE_UINT64:
                param = ULL2NUM(*(uint64_t *) parameters[i]);
                break;
            case NATIVE_LONG:
                param = LONG2NUM(*(long *) parameters[i]);
                break;
            case NATIVE_ULONG:
                param = ULONG2NUM(*(unsigned long *) parameters[i]);
                break;
            case NATIVE_FLOAT32:
                param = rb_float_new(*(float *) parameters[i]);
                break;
            case NATIVE_FLOAT64:
                param = rb_float_new(*(double *) parameters[i]);
                break;
            case NATIVE_LONGDOUBLE:
                param = rbffi_longdouble_new(*(long double *) parameters[i]);
                break;
            case NATIVE_STRING:
                param = (*(void **) parameters[i] != NULL) ? rb_str_new2(*(char **) parameters[i]) : Qnil;
                break;
            case NATIVE_POINTER:
                param = rbffi_Pointer_NewInstance(*(void **) parameters[i]);
                break;
            case NATIVE_BOOL:
                param = (*(uint8_t *) parameters[i]) ? Qtrue : Qfalse;
                break;

            case NATIVE_FUNCTION:
            case NATIVE_STRUCT:
                param = rbffi_NativeValue_ToRuby(paramType, rbParamType, parameters[i]);
                break;

            default:
                param = Qnil;
                break;
        }

        /* Convert the native value into a custom ruby value */
        if (unlikely(cbInfo->parameterTypes[i]->nativeType == NATIVE_MAPPED)) {
            VALUE values[] = { param, Qnil };
            param = rb_funcall2(((MappedType *) cbInfo->parameterTypes[i])->rbConverter, id_from_native, 2, values);
        }

        rbParams[i] = param;
    }

    rbReturnValue = rb_funcall2(fn->rbProc, id_call, cbInfo->parameterCount, rbParams);

    if (unlikely(returnType->nativeType == NATIVE_MAPPED)) {
        VALUE values[] = { rbReturnValue, Qnil };
        rbReturnValue = rb_funcall2(((MappedType *) returnType)->rbConverter, id_to_native, 2, values);
        rbReturnType = ((MappedType *) returnType)->rbType;
        returnType = ((MappedType* ) returnType)->type;
    }

    if (rbReturnValue == Qnil || TYPE(rbReturnValue) == T_NIL) {
        memset(retval, 0, returnType->ffiType->size);
    } else switch (returnType->nativeType) {
        case NATIVE_INT8:
        case NATIVE_INT16:
        case NATIVE_INT32:
            *((ffi_sarg *) retval) = NUM2INT(rbReturnValue);
            break;
        case NATIVE_UINT8:
        case NATIVE_UINT16:
        case NATIVE_UINT32:
            *((ffi_arg *) retval) = NUM2UINT(rbReturnValue);
            break;
        case NATIVE_INT64:
            *((int64_t *) retval) = NUM2LL(rbReturnValue);
            break;
        case NATIVE_UINT64:
            *((uint64_t *) retval) = NUM2ULL(rbReturnValue);
            break;
        case NATIVE_LONG:
            *((ffi_sarg *) retval) = NUM2LONG(rbReturnValue);
            break;
        case NATIVE_ULONG:
            *((ffi_arg *) retval) = NUM2ULONG(rbReturnValue);
            break;
        case NATIVE_FLOAT32:
            *((float *) retval) = (float) NUM2DBL(rbReturnValue);
            break;
        case NATIVE_FLOAT64:
            *((double *) retval) = NUM2DBL(rbReturnValue);
            break;
        case NATIVE_LONGDOUBLE:
            *((long double *) retval) = rbffi_num2longdouble(rbReturnValue);
            break;
        case NATIVE_POINTER:
            if (TYPE(rbReturnValue) == T_DATA && rb_obj_is_kind_of(rbReturnValue, rbffi_PointerClass)) {
                AbstractMemory* memory;
                TypedData_Get_Struct(rbReturnValue, AbstractMemory, &rbffi_abstract_memory_data_type, memory);
                *((void **) retval) = memory->address;
            } else {
                /* Default to returning NULL if not a value pointer object.  handles nil case as well */
                *((void **) retval) = NULL;
            }
            break;

        case NATIVE_BOOL:
            *((ffi_arg *) retval) = rbReturnValue == Qtrue;
            break;

        case NATIVE_FUNCTION:
            if (TYPE(rbReturnValue) == T_DATA && rb_obj_is_kind_of(rbReturnValue, rbffi_PointerClass)) {
                AbstractMemory* memory;
                TypedData_Get_Struct(rbReturnValue, AbstractMemory, &rbffi_abstract_memory_data_type, memory);

                *((void **) retval) = memory->address;

            } else if (rb_obj_is_kind_of(rbReturnValue, rb_cProc) || rb_respond_to(rbReturnValue, id_call)) {
                VALUE function;
                AbstractMemory* memory;

                function = rbffi_Function_ForProc(rbReturnType, rbReturnValue);

                TypedData_Get_Struct(function, AbstractMemory, &rbffi_abstract_memory_data_type, memory);

                *((void **) retval) = memory->address;
            } else {
                *((void **) retval) = NULL;
            }
            break;

        case NATIVE_STRUCT:
            if (TYPE(rbReturnValue) == T_DATA && rb_obj_is_kind_of(rbReturnValue, rbffi_StructClass)) {
                Struct* s;
                AbstractMemory* memory;

                TypedData_Get_Struct(rbReturnValue, Struct, &rbffi_struct_data_type, s);
                memory = s->pointer;

                if (memory->address != NULL) {
                    memcpy(retval, memory->address, returnType->ffiType->size);

                } else {
                    memset(retval, 0, returnType->ffiType->size);
                }

            } else {
                memset(retval, 0, returnType->ffiType->size);
            }
            break;

        default:
            *((ffi_arg *) retval) = 0;
            break;
    }

    return Qnil;
}

static VALUE
save_callback_exception(VALUE data, VALUE exc)
{
    struct gvl_callback* cb = (struct gvl_callback *) data;

    memset(cb->retval, 0, ((Function *) cb->closure->info)->info->returnType->ffiType->size);
    if (cb->frame != NULL) cb->frame->exc = exc;

    return Qnil;
}

static bool
callback_prep(void* ctx, void* code, Closure* closure, char* errmsg, size_t errmsgsize)
{
    FunctionType* fnInfo = (FunctionType *) ctx;
    ffi_status ffiStatus;

    ffiStatus = ffi_prep_closure_loc(closure->pcl, &fnInfo->ffi_cif, callback_invoke, closure, code);
    if (ffiStatus != FFI_OK) {
        snprintf(errmsg, errmsgsize, "ffi_prep_closure_loc failed.  status=%#x", ffiStatus);
        return false;
    }

    return true;
}

void
rbffi_Function_Init(VALUE moduleFFI)
{
    rbffi_FunctionInfo_Init(moduleFFI);
    /*
     * Document-class: FFI::Function < FFI::Pointer
     */
    rbffi_FunctionClass = rb_define_class_under(moduleFFI, "Function", rbffi_PointerClass);

    rb_global_variable(&rbffi_FunctionClass);
    rb_define_alloc_func(rbffi_FunctionClass, function_allocate);

    rb_define_method(rbffi_FunctionClass, "initialize", function_initialize, -1);
    rb_define_method(rbffi_FunctionClass, "initialize_copy", function_initialize_copy, 1);
    rb_define_method(rbffi_FunctionClass, "call", function_call, -1);
    rb_define_method(rbffi_FunctionClass, "attach", function_attach, 2);
    rb_define_method(rbffi_FunctionClass, "free", function_release, 0);
    rb_define_method(rbffi_FunctionClass, "autorelease=", function_set_autorelease, 1);
    rb_define_private_method(rbffi_FunctionClass, "type", function_type, 0);
    /*
     * call-seq: autorelease
     * @return [Boolean]
     * Get +autorelease+ attribute.
     * Synonymous for {#autorelease?}.
     */
    rb_define_method(rbffi_FunctionClass, "autorelease", function_autorelease_p, 0);
    /*
     * call-seq: autorelease?
     * @return [Boolean] +autorelease+ attribute
     * Get +autorelease+ attribute.
     */
    rb_define_method(rbffi_FunctionClass, "autorelease?", function_autorelease_p, 0);

    id_call = rb_intern("call");
    id_cbtable = rb_intern("@__ffi_callback_table__");
    id_cb_ref = rb_intern("@__ffi_callback__");
    id_to_native = rb_intern("to_native");
    id_from_native = rb_intern("from_native");
#if defined(DEFER_ASYNC_CALLBACK) && defined(HAVE_RB_EXT_RACTOR_SAFE)
    async_cb_dispatcher_key = rb_ractor_local_storage_ptr_newkey(&async_cb_dispatcher_key_type);
#endif
}
