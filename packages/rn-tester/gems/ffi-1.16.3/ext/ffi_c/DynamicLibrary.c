/*
 * Copyright (c) 2008-2010 Wayne Meissner
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

#include <sys/types.h>
#include <stdio.h>
#include <stdint.h>
#if (defined(_WIN32) || defined(__WIN32__)) && !defined(__CYGWIN__)
# include <winsock2.h>
# define _WINSOCKAPI_
# include <windows.h>
# include <shlwapi.h>
#else
# include <dlfcn.h>
#endif
#include <ruby.h>

#include <ffi.h>

#include "rbffi.h"
#include "compat.h"
#include "AbstractMemory.h"
#include "Pointer.h"
#include "DynamicLibrary.h"

typedef struct LibrarySymbol_ {
    Pointer base;
    VALUE name;
} LibrarySymbol;


static VALUE library_initialize(VALUE self, VALUE libname, VALUE libflags);
static void library_free(void *);
static size_t library_memsize(const void *);

static VALUE symbol_allocate(VALUE klass);
static VALUE symbol_new(VALUE library, void* address, VALUE name);
static void symbol_mark(void *data);
static void symbol_compact(void *data);
static size_t symbol_memsize(const void *data);

static const rb_data_type_t rbffi_library_data_type = {
    .wrap_struct_name = "FFI::DynamicLibrary",
    .function = {
        .dmark = NULL,
        .dfree = library_free,
        .dsize = library_memsize,
    },
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static const rb_data_type_t library_symbol_data_type = {
    .wrap_struct_name = "FFI::DynamicLibrary::Symbol",
    .function = {
        .dmark = symbol_mark,
        .dfree = RUBY_TYPED_DEFAULT_FREE,
        .dsize = symbol_memsize,
        ffi_compact_callback( symbol_compact )
    },
    .parent = &rbffi_pointer_data_type,
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static VALUE LibraryClass = Qnil, SymbolClass = Qnil;

#if (defined(_WIN32) || defined(__WIN32__)) && !defined(__CYGWIN__)
static void* dl_open(const char* name, int flags);
static void dl_error(char* buf, int size);
#define dl_sym(handle, name) GetProcAddress(handle, name)
#define dl_close(handle) FreeLibrary(handle)
#else
# define dl_open(name, flags) dlopen(name, flags != 0 ? flags : RTLD_LAZY)
# define dl_error(buf, size) do { snprintf(buf, size, "%s", dlerror()); } while(0)
# define dl_sym(handle, name) dlsym(handle, name)
# define dl_close(handle) dlclose(handle)
#endif

static VALUE
library_allocate(VALUE klass)
{
    Library* library;
    return TypedData_Make_Struct(klass, Library, &rbffi_library_data_type, library);
}

/*
 * call-seq: DynamicLibrary.open(libname, libflags)
 * @param libname (see #initialize)
 * @param libflags (see #initialize)
 * @return [FFI::DynamicLibrary]
 * @raise {LoadError} if +libname+ cannot be opened
 * Open a library.
 */
static VALUE
library_open(VALUE klass, VALUE libname, VALUE libflags)
{
    return library_initialize(library_allocate(klass), libname, libflags);
}

/*
 * call-seq: initialize(libname, libflags)
 * @param [String] libname name of library to open
 * @param [Fixnum] libflags flags for library to open
 * @return [FFI::DynamicLibrary]
 * @raise {LoadError} if +libname+ cannot be opened
 * A new DynamicLibrary instance.
 */
static VALUE
library_initialize(VALUE self, VALUE libname, VALUE libflags)
{
    Library* library;
    int flags;

    Check_Type(libflags, T_FIXNUM);

    TypedData_Get_Struct(self, Library, &rbffi_library_data_type, library);
    flags = libflags != Qnil ? NUM2UINT(libflags) : 0;

    library->handle = dl_open(libname != Qnil ? StringValueCStr(libname) : NULL, flags);
    if (library->handle == NULL) {
        char errmsg[1024];
        dl_error(errmsg, sizeof(errmsg));
        rb_raise(rb_eLoadError, "Could not open library '%s': %s",
                libname != Qnil ? StringValueCStr(libname) : "[current process]",
                errmsg);
    }
#ifdef __CYGWIN__
    // On Cygwin 1.7.17 "dlsym(dlopen(0,0), 'getpid')" fails. (dlerror: "No such process")
    // As a workaround we can use "dlsym(RTLD_DEFAULT, 'getpid')" instead.
    // Since 0 == RTLD_DEFAULT we won't call dl_close later.
    if (libname == Qnil) {
        dl_close(library->handle);
        library->handle = RTLD_DEFAULT;
    }
#endif
    rb_iv_set(self, "@name", libname != Qnil ? rb_str_new_frozen(libname) : rb_str_new2("[current process]"));

    rb_obj_freeze(self);
    return self;
}

static VALUE
library_dlsym(VALUE self, VALUE name)
{
    Library* library;
    void* address = NULL;
    Check_Type(name, T_STRING);

    TypedData_Get_Struct(self, Library, &rbffi_library_data_type, library);
    address = dl_sym(library->handle, StringValueCStr(name));

    return address != NULL ? symbol_new(self, address, name) : Qnil;
}

/*
 * call-seq: last_error
 * @return [String] library's last error string
 */
static VALUE
library_dlerror(VALUE self)
{
    char errmsg[1024];
    dl_error(errmsg, sizeof(errmsg));
    return rb_str_new2(errmsg);
}

static void
library_free(void *data)
{
    Library *library = (Library*)data;

    /* dlclose() on MacOS tends to segfault - avoid it */
#ifndef __APPLE__
    if (library->handle != NULL) {
        dl_close(library->handle);
    }
#endif
    xfree(library);
}

static size_t
library_memsize(const void *data)
{
    return sizeof(Library);
}

#if (defined(_WIN32) || defined(__WIN32__)) && !defined(__CYGWIN__)
static void*
dl_open(const char* name, int flags)
{
    if (name == NULL) {
        return GetModuleHandle(NULL);
    } else {
        DWORD dwFlags = PathIsRelativeA(name) ? 0 : LOAD_WITH_ALTERED_SEARCH_PATH;
        return LoadLibraryExA(name, NULL, dwFlags);
    }
}

static void
dl_error(char* buf, int size)
{
    // Get the last error code
    DWORD error = GetLastError();

    // Get the associated message
    LPSTR message = NULL;
    FormatMessageA(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER, 
                   NULL, error, 0, (LPSTR)&message, 0, NULL);

    // Update the passed in buffer
    snprintf(buf, size, "Failed with error %d: %s", error, message);

    // Free the allocated message
    LocalFree(message);
}
#endif

static VALUE
symbol_allocate(VALUE klass)
{
    LibrarySymbol* sym;
    VALUE obj = TypedData_Make_Struct(klass, LibrarySymbol, &library_symbol_data_type, sym);
    RB_OBJ_WRITE(obj, &sym->base.rbParent, Qnil);
    RB_OBJ_WRITE(obj, &sym->name, Qnil);

    return obj;
}


/*
 * call-seq: initialize_copy(other)
 * @param [Object] other
 * @return [nil]
 * DO NOT CALL THIS METHOD
 */
static VALUE
symbol_initialize_copy(VALUE self, VALUE other)
{
    rb_raise(rb_eRuntimeError, "cannot duplicate symbol");
    return Qnil;
}

static VALUE
symbol_new(VALUE library, void* address, VALUE name)
{
    LibrarySymbol* sym;
    VALUE obj = TypedData_Make_Struct(SymbolClass, LibrarySymbol, &library_symbol_data_type, sym);

    sym->base.memory.address = address;
    sym->base.memory.size = LONG_MAX;
    sym->base.memory.typeSize = 1;
    sym->base.memory.flags = MEM_RD | MEM_WR;
    RB_OBJ_WRITE(obj, &sym->base.rbParent, library);
    RB_OBJ_WRITE(obj, &sym->name, rb_str_new_frozen(name));

    rb_obj_freeze(obj);
    return obj;
}

static void
symbol_mark(void *data)
{
    LibrarySymbol *sym = (LibrarySymbol *)data;
    rb_gc_mark_movable(sym->base.rbParent);
    rb_gc_mark_movable(sym->name);
}

static void
symbol_compact(void *data)
{
    LibrarySymbol *sym = (LibrarySymbol *)data;
    ffi_gc_location(sym->base.rbParent);
    ffi_gc_location(sym->name);
}

static size_t
symbol_memsize(const void *data)
{
    return sizeof(LibrarySymbol);
}

/*
 * call-seq: inspect
 * @return [String]
 * Inspect.
 */
static VALUE
symbol_inspect(VALUE self)
{
    LibrarySymbol* sym;
    char buf[256];

    TypedData_Get_Struct(self, LibrarySymbol, &library_symbol_data_type, sym);
    snprintf(buf, sizeof(buf), "#<FFI::DynamicLibrary::Symbol name=%s address=%p>",
             StringValueCStr(sym->name), sym->base.memory.address);
    return rb_str_new2(buf);
}

void
rbffi_DynamicLibrary_Init(VALUE moduleFFI)
{
    /*
     * Document-class: FFI::DynamicLibrary
     */
    LibraryClass = rb_define_class_under(moduleFFI, "DynamicLibrary", rb_cObject);
    rb_global_variable(&LibraryClass);
    /*
     * Document-class: FFI::DynamicLibrary::Symbol < FFI::Pointer
     *
     * An instance of this class represents a library symbol. It may be a {Pointer pointer} to
     * a function or to a variable.
     */
    SymbolClass = rb_define_class_under(LibraryClass, "Symbol", rbffi_PointerClass);
    rb_global_variable(&SymbolClass);

    /*
     * Document-const: FFI::NativeLibrary
     * Backward compatibility for FFI::DynamicLibrary
     */
    rb_define_const(moduleFFI, "NativeLibrary", LibraryClass); /* backwards compat library */
    rb_define_alloc_func(LibraryClass, library_allocate);
    rb_define_singleton_method(LibraryClass, "open", library_open, 2);
    rb_define_singleton_method(LibraryClass, "last_error", library_dlerror, 0);
    rb_define_method(LibraryClass, "initialize", library_initialize, 2);
    /*
     * Document-method: find_symbol
     * call-seq: find_symbol(name)
     * @param [String] name library symbol's name
     * @return [FFI::DynamicLibrary::Symbol] library symbol
     */
    rb_define_method(LibraryClass, "find_symbol", library_dlsym, 1);
    /*
     * Document-method: find_function
     * call-seq: find_function(name)
     * @param [String] name library function's name
     * @return [FFI::DynamicLibrary::Symbol] library function symbol
     */
    rb_define_method(LibraryClass, "find_function", library_dlsym, 1);
    /*
     * Document-method: find_variable
     * call-seq: find_variable(name)
     * @param [String] name library variable's name
     * @return [FFI::DynamicLibrary::Symbol] library variable symbol
     */
    rb_define_method(LibraryClass, "find_variable", library_dlsym, 1);
    rb_define_method(LibraryClass, "last_error", library_dlerror, 0);
    rb_define_attr(LibraryClass, "name", 1, 0);

    rb_define_alloc_func(SymbolClass, symbol_allocate);
    rb_undef_method(SymbolClass, "new");
    rb_define_method(SymbolClass, "inspect", symbol_inspect, 0);
    rb_define_method(SymbolClass, "initialize_copy", symbol_initialize_copy, 1);

#define DEF(x) rb_define_const(LibraryClass, "RTLD_" #x, UINT2NUM(RTLD_##x))
    DEF(LAZY);
    DEF(NOW);
    DEF(GLOBAL);
    DEF(LOCAL);
    DEF(NOLOAD);
    DEF(NODELETE);
    DEF(FIRST);
    DEF(DEEPBIND);
    DEF(MEMBER);
    DEF(BINDING_MASK);
    DEF(LOCATION_MASK);
    DEF(ALL_MASK);
#undef DEF

}
