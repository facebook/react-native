/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 1998, 2008, 2011 Red Hat, Inc.
        Copyright (c) 2011 Plausible Labs Cooperative, Inc.
        Copyright (c) 2019 Microsoft Corporation.

   ARM Foreign Function Interface

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
   DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_cfi.h>
#include "internal.h"
#include "ksarm.h"


        ; 8 byte aligned AREA to support 8 byte aligned jump tables
        MACRO
        NESTED_ENTRY_FFI $FuncName, $AreaName, $ExceptHandler

        ; compute the function's labels
        __DeriveFunctionLabels $FuncName

        ; determine the area we will put the function into
__FuncArea   SETS    "|.text|"
        IF "$AreaName" != ""
__FuncArea   SETS    "$AreaName"
        ENDIF

        ; set up the exception handler itself
__FuncExceptionHandler SETS ""
        IF "$ExceptHandler" != ""
__FuncExceptionHandler SETS    "|$ExceptHandler|"
        ENDIF

        ; switch to the specified area, jump tables require 8 byte alignment
        AREA    $__FuncArea,CODE,CODEALIGN,ALIGN=3,READONLY

        ; export the function name
        __ExportProc $FuncName

        ; flush any pending literal pool stuff
        ROUT

        ; reset the state of the unwind code tracking
        __ResetUnwindState

        MEND

;        MACRO
;        TABLE_ENTRY $Type, $Table
;$Type_$Table
;        MEND

#define E(index,table) return_##index##_##table

    ; r0:   stack
    ; r1:   frame
    ; r2:   fn
    ; r3:   vfp_used

    ; fake entry point exists only to generate exists only to 
    ; generate .pdata for exception unwinding
    NESTED_ENTRY_FFI ffi_call_VFP_fake
    PROLOG_PUSH  {r11, lr}          ; save fp and lr for unwind

    ALTERNATE_ENTRY ffi_call_VFP
    cmp    r3, #3                   ; load only d0 if possible
    vldrle d0, [r0]
    vldmgt r0, {d0-d7}
    add    r0, r0, #64              ; discard the vfp register args
    b ffi_call_SYSV
    NESTED_END ffi_call_VFP_fake

    ; fake entry point exists only to generate exists only to 
    ; generate .pdata for exception unwinding
    NESTED_ENTRY_FFI ffi_call_SYSV_fake
    PROLOG_PUSH  {r11, lr}          ; save fp and lr for unwind

    ALTERNATE_ENTRY ffi_call_SYSV
    stm    r1, {fp, lr}
    mov    fp, r1

    mov    sp, r0                   ; install the stack pointer
    mov    lr, r2                   ; move the fn pointer out of the way
    ldr    ip, [fp, #16]            ; install the static chain
    ldmia  sp!, {r0-r3}             ; move first 4 parameters in registers.
    blx    lr                       ; call fn

    ; Load r2 with the pointer to storage for the return value
    ; Load r3 with the return type code
    ldr    r2, [fp, #8]
    ldr    r3, [fp, #12]

    ; Deallocate the stack with the arguments.
    mov    sp, fp

    ; Store values stored in registers.
    ALIGN 8
    lsl     r3, #3
    add     r3, r3, pc
    add     r3, #8
    mov     pc, r3


E(ARM_TYPE_VFP_S, ffi_call)
    ALIGN 8
    vstr s0, [r2]
    pop    {fp,pc}
E(ARM_TYPE_VFP_D, ffi_call)
    ALIGN 8
    vstr d0, [r2]
    pop    {fp,pc}
E(ARM_TYPE_VFP_N, ffi_call)
    ALIGN 8
    vstm r2, {d0-d3}
    pop    {fp,pc}
E(ARM_TYPE_INT64, ffi_call)
    ALIGN 8
    str    r1, [r2, #4]
    nop
E(ARM_TYPE_INT, ffi_call)
    ALIGN 8
    str    r0, [r2]
    pop    {fp,pc}
E(ARM_TYPE_VOID, ffi_call)
    ALIGN 8
    pop    {fp,pc}
    nop
E(ARM_TYPE_STRUCT, ffi_call)
    ALIGN 8
    cmp r3, #ARM_TYPE_STRUCT
    pop    {fp,pc}
    NESTED_END ffi_call_SYSV_fake

    IMPORT |ffi_closure_inner_SYSV|
    /*
    int ffi_closure_inner_SYSV
    (
        cif,        ; r0
        fun,        ; r1
        user_data,  ; r2
        frame       ; r3
    )
    */

    NESTED_ENTRY_FFI ffi_go_closure_SYSV
    stmdb   sp!, {r0-r3}            ; save argument regs
    ldr     r0, [ip, #4]            ; load cif
    ldr     r1, [ip, #8]            ; load fun
    mov     r2, ip                  ; load user_data
    b       ffi_go_closure_SYSV_0
    NESTED_END ffi_go_closure_SYSV

    ; r3:    ffi_closure

    ; fake entry point exists only to generate exists only to 
    ; generate .pdata for exception unwinding
    NESTED_ENTRY_FFI ffi_closure_SYSV_fake  
    PROLOG_PUSH  {r11, lr}          ; save fp and lr for unwind
    ALTERNATE_ENTRY ffi_closure_SYSV
    ldmfd   sp!, {ip,r0}            ; restore fp (r0 is used for stack alignment)
    stmdb   sp!, {r0-r3}            ; save argument regs

    ldr     r0, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET]    ; ffi_closure->cif
    ldr     r1, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET+4]  ; ffi_closure->fun
    ldr     r2, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET+8]  ; ffi_closure->user_data

    ALTERNATE_ENTRY ffi_go_closure_SYSV_0
    add     ip, sp, #16             ; compute entry sp

    sub     sp, sp, #64+32          ; allocate frame parameter (sizeof(vfp_space) = 64, sizeof(result) = 32)
    mov     r3, sp                  ; set frame parameter
    stmdb   sp!, {ip,lr}

    bl      ffi_closure_inner_SYSV  ; call the Python closure

                                    ; Load values returned in registers.
    add     r2, sp, #64+8           ; address of closure_frame->result
    bl      ffi_closure_ret         ; move result to correct register or memory for type

    ldmfd   sp!, {ip,lr}
    mov     sp, ip                  ; restore stack pointer
    mov     pc, lr
    NESTED_END ffi_closure_SYSV_fake

    IMPORT |ffi_closure_inner_VFP|
    /*
    int ffi_closure_inner_VFP
    (
        cif,        ; r0
        fun,        ; r1
        user_data,  ; r2
        frame       ; r3
    )
    */

    NESTED_ENTRY_FFI ffi_go_closure_VFP
    stmdb   sp!, {r0-r3}			; save argument regs
    ldr	r0, [ip, #4]			; load cif
    ldr	r1, [ip, #8]			; load fun
    mov	r2, ip				; load user_data
    b	ffi_go_closure_VFP_0
    NESTED_END ffi_go_closure_VFP

    ; fake entry point exists only to generate exists only to 
    ; generate .pdata for exception unwinding
    ; r3:    closure
    NESTED_ENTRY_FFI ffi_closure_VFP_fake
    PROLOG_PUSH  {r11, lr}          ; save fp and lr for unwind

    ALTERNATE_ENTRY ffi_closure_VFP
    ldmfd   sp!, {ip,r0}            ; restore fp (r0 is used for stack alignment)
    stmdb   sp!, {r0-r3}            ; save argument regs

    ldr     r0, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET]    ; load cif
    ldr     r1, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET+4]  ; load fun
    ldr     r2, [ip, #FFI_TRAMPOLINE_CLOSURE_OFFSET+8]  ; load user_data

    ALTERNATE_ENTRY ffi_go_closure_VFP_0
    add     ip, sp, #16             ; compute entry sp
    sub     sp, sp, #32             ; save space for closure_frame->result
    vstmdb  sp!, {d0-d7}            ; push closure_frame->vfp_space

    mov     r3, sp                  ; save closure_frame
    stmdb   sp!, {ip,lr}

    bl      ffi_closure_inner_VFP

    ; Load values returned in registers.
    add     r2, sp, #64+8           ; load result
    bl      ffi_closure_ret
    ldmfd   sp!, {ip,lr}
    mov     sp, ip                  ; restore stack pointer
    mov     pc, lr
    NESTED_END ffi_closure_VFP_fake

/* Load values returned in registers for both closure entry points.
   Note that we use LDM with SP in the register set.  This is deprecated
   by ARM, but not yet unpredictable.  */

    NESTED_ENTRY_FFI ffi_closure_ret
    stmdb sp!, {fp,lr}

    ALIGN 8
    lsl     r0, #3
    add     r0, r0, pc
    add     r0, #8
    mov     pc, r0

E(ARM_TYPE_VFP_S, ffi_closure)
    ALIGN 8
    vldr s0, [r2]
    b call_epilogue
E(ARM_TYPE_VFP_D, ffi_closure)
    ALIGN 8
    vldr d0, [r2]
    b call_epilogue
E(ARM_TYPE_VFP_N, ffi_closure)
    ALIGN 8
    vldm r2, {d0-d3}
    b call_epilogue
E(ARM_TYPE_INT64, ffi_closure)
    ALIGN 8
    ldr    r1, [r2, #4]
    nop
E(ARM_TYPE_INT, ffi_closure)
    ALIGN 8
    ldr    r0, [r2]
    b call_epilogue
E(ARM_TYPE_VOID, ffi_closure)
    ALIGN 8
    b call_epilogue
    nop
E(ARM_TYPE_STRUCT, ffi_closure)
    ALIGN 8
    b call_epilogue
call_epilogue
    ldmfd sp!, {fp,pc}
    NESTED_END ffi_closure_ret

    AREA |.trampoline|, DATA, THUMB, READONLY
    EXPORT |ffi_arm_trampoline|
|ffi_arm_trampoline| DATA
thisproc    adr    ip, thisproc
            stmdb  sp!, {ip, r0}
            ldr    pc, [pc, #0]
            DCD    0
            ;ENDP

    END