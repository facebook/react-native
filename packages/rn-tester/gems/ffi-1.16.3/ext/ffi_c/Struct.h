/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 * Copyright (c) 2009, Luc Heinrich <luc@honk-honk.com>
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

#ifndef RBFFI_STRUCT_H
#define	RBFFI_STRUCT_H

#include "extconf.h"
#include "AbstractMemory.h"
#include "Type.h"
#include <ruby/st.h>

#ifdef	__cplusplus
extern "C" {
#endif

    extern void rbffi_Struct_Init(VALUE ffiModule);
    extern void rbffi_StructLayout_Init(VALUE ffiModule);
    extern const rb_data_type_t rbffi_struct_layout_data_type;
    extern const rb_data_type_t rbffi_struct_field_data_type;

    typedef struct StructField_ StructField;
    typedef struct StructLayout_ StructLayout;
    typedef struct Struct_ Struct;

    struct StructField_ {
        Type* type;
        unsigned int offset;

        int referenceIndex;

        bool referenceRequired;
        VALUE rbType;
        VALUE rbName;

        MemoryOp* memoryOp;
    };

    struct StructLayout_ {
        Type base;
        StructField** fields;
        int fieldCount;
        int size;
        int align;
        ffi_type** ffiTypes;

        /*
        * We use the fieldName's minor 8 Bits as index to a 256 entry cache.
        * This avoids full ruby hash lookups for repeated lookups.
        */
        #define FIELD_CACHE_LOOKUP(this, sym) ( &(this)->cache_row[((sym) >> 8) & 0xff] )
        #define FIELD_CACHE_ROWS 0x100

        struct field_cache_entry {
          VALUE fieldName;
          StructField *field;
        } cache_row[FIELD_CACHE_ROWS];

        /** The number of reference tracking fields in this struct */
        int referenceFieldCount;

        VALUE rbFieldNames;
        VALUE rbFieldMap;
        VALUE rbFields;
    };

    struct Struct_ {
        StructLayout* layout;
        AbstractMemory* pointer;
        VALUE* rbReferences;

        VALUE rbLayout;
        VALUE rbPointer;
    };

    extern const rb_data_type_t rbffi_struct_data_type;
    extern const rb_data_type_t rbffi_struct_field_data_type;
    extern VALUE rbffi_StructClass, rbffi_StructLayoutClass;
    extern VALUE rbffi_StructLayoutFieldClass, rbffi_StructLayoutFunctionFieldClass;
    extern VALUE rbffi_StructLayoutArrayFieldClass;
    extern VALUE rbffi_StructInlineArrayClass;
    extern VALUE rbffi_StructLayoutCharArrayClass;

#ifdef	__cplusplus
}
#endif

#endif	/* RBFFI_STRUCT_H */

