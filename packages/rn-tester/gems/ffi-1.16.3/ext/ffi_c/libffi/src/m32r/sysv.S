/* -----------------------------------------------------------------------
   sysv.S - Copyright (c) 2004 Renesas Technology
   
   M32R Foreign Function Interface 

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL RENESAS TECHNOLOGY BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#define LIBFFI_ASM
#include <fficonfig.h>
#include <ffi.h>
#ifdef HAVE_MACHINE_ASM_H
#include <machine/asm.h>
#else
/* XXX these lose for some platforms, I'm sure.  */
#define CNAME(x) x
#define ENTRY(x) .globl CNAME(x)! .type CNAME(x),%function! CNAME(x):
#endif

.text

	/* R0:   ffi_prep_args */
	/* R1:   &ecif */
	/* R2:   cif->bytes */
	/* R3:   fig->flags */
	/* sp+0: ecif.rvalue */
	/* sp+4: fn */

	/* This assumes we are using gas.  */
ENTRY(ffi_call_SYSV)
	/* Save registers.  */
	push	fp
	push	lr
	push	r3
	push	r2
	push	r1
	push	r0
	mv	fp, sp

	/* Make room for all of the new args.  */
	sub	sp, r2

	/* Place all of the ffi_prep_args in position.  */
	mv	lr, r0	
	mv	r0, sp
	/* R1 already set.  */

	/* And call.  */
	jl	lr

	/* Move first 4 parameters in registers...  */
	ld	r0, @(0,sp)
	ld	r1, @(4,sp)
	ld	r2, @(8,sp)
        ld	r3, @(12,sp)

	/* ...and adjust the stack.  */
	ld	lr, @(8,fp)
        cmpi	lr, #16
	bc	adjust_stack
	ldi	lr, #16
adjust_stack:
        add	sp, lr

	/* Call the function.  */
	ld	lr, @(28,fp)
	jl	lr	

	/* Remove the space we pushed for the args.  */
	mv	sp, fp	

	/* Load R2 with the pointer to storage for the return value.  */
	ld	r2, @(24,sp)

	/* Load R3 with the return type code.  */
	ld	r3, @(12,sp)

	/* If the return value pointer is NULL, assume no return value.  */
	beqz	r2, epilogue

	/* Return INT.  */
	ldi	r4, #FFI_TYPE_INT
	bne	r3, r4, return_double
	st	r0, @r2	
	bra	epilogue

return_double:
	/* Return DOUBLE or LONGDOUBLE.  */
	ldi	r4, #FFI_TYPE_DOUBLE
	bne	r3, r4, epilogue
	st	r0, @r2	
	st	r1, @(4,r2)

epilogue:
	pop	r0
	pop	r1
	pop	r2
	pop	r3
	pop	lr
	pop	fp
        jmp lr

.ffi_call_SYSV_end:
        .size    CNAME(ffi_call_SYSV),.ffi_call_SYSV_end-CNAME(ffi_call_SYSV)
