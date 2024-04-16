/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2012, 2013 Xilinx, Inc

   MicroBlaze Foreign Function Interface

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

#include <ffi.h>
#include <ffi_common.h>

extern void ffi_call_SYSV(void (*)(void*, extended_cif*), extended_cif*,
		unsigned int, unsigned int, unsigned int*, void (*fn)(void),
		unsigned int, unsigned int);

extern void ffi_closure_SYSV(void);

#define WORD_SIZE			sizeof(unsigned int)
#define ARGS_REGISTER_SIZE	(WORD_SIZE * 6)
#define WORD_FFI_ALIGN(x)		FFI_ALIGN(x, WORD_SIZE)

/* ffi_prep_args is called by the assembly routine once stack space
   has been allocated for the function's arguments */
void ffi_prep_args(void* stack, extended_cif* ecif)
{
	unsigned int i;
	ffi_type** p_arg;
	void** p_argv;
	void* stack_args_p = stack;

	if (ecif == NULL || ecif->cif == NULL) {
		return; /* no description to prepare */
	}

	p_argv = ecif->avalue;

	if ((ecif->cif->rtype != NULL) &&
			(ecif->cif->rtype->type == FFI_TYPE_STRUCT))
	{
		/* if return type is a struct which is referenced on the stack/reg5,
		 * by a pointer. Stored the return value pointer in r5.
		 */
		char* addr = stack_args_p;
		memcpy(addr, &(ecif->rvalue), WORD_SIZE);
		stack_args_p += WORD_SIZE;
	}

	if (ecif->avalue == NULL) {
		return; /* no arguments to prepare */
	}

	for (i = 0, p_arg = ecif->cif->arg_types; i < ecif->cif->nargs;
			i++, p_arg++)
	{
		size_t size = (*p_arg)->size;
		int type = (*p_arg)->type;
		void* value = p_argv[i];
		char* addr = stack_args_p;
		int aligned_size = WORD_FFI_ALIGN(size);

		/* force word alignment on the stack */
		stack_args_p += aligned_size;
		
		switch (type)
		{
			case FFI_TYPE_UINT8:
				*(unsigned int *)addr = (unsigned int)*(UINT8*)(value);
				break;
			case FFI_TYPE_SINT8:
				*(signed int *)addr = (signed int)*(SINT8*)(value);
				break;
			case FFI_TYPE_UINT16:
				*(unsigned int *)addr = (unsigned int)*(UINT16*)(value);
				break;
			case FFI_TYPE_SINT16:
				*(signed int *)addr = (signed int)*(SINT16*)(value);
				break;
			case FFI_TYPE_STRUCT:
#if __BIG_ENDIAN__
				/*
				 * MicroBlaze toolchain appears to emit:
				 * bsrli r5, r5, 8 (caller)
				 * ...
				 * <branch to callee>
				 * ...
				 * bslli r5, r5, 8 (callee)
				 * 
				 * For structs like "struct a { uint8_t a[3]; };", when passed
				 * by value.
				 *
				 * Structs like "struct b { uint16_t a; };" are also expected
				 * to be packed strangely in registers.
				 *
				 * This appears to be because the microblaze toolchain expects
				 * "struct b == uint16_t", which is only any issue for big
				 * endian.
				 *
				 * The following is a work around for big-endian only, for the
				 * above mentioned case, it will re-align the contents of a
				 * <= 3-byte struct value.
				 */
				if (size < WORD_SIZE)
				{
				  memcpy (addr + (WORD_SIZE - size), value, size);
				  break;
				}
#endif
			case FFI_TYPE_SINT32:
			case FFI_TYPE_UINT32:
			case FFI_TYPE_FLOAT:
			case FFI_TYPE_SINT64:
			case FFI_TYPE_UINT64:
			case FFI_TYPE_DOUBLE:
			default:
				memcpy(addr, value, aligned_size);
		}
	}
}

ffi_status ffi_prep_cif_machdep(ffi_cif* cif)
{
	/* check ABI */
	switch (cif->abi)
	{
		case FFI_SYSV:
			break;
		default:
			return FFI_BAD_ABI;
	}
	return FFI_OK;
}

void ffi_call(ffi_cif* cif, void (*fn)(void), void* rvalue, void** avalue)
{
	extended_cif ecif;
	ecif.cif = cif;
	ecif.avalue = avalue;

	/* If the return value is a struct and we don't have a return */
	/* value address then we need to make one */
	if ((rvalue == NULL) && (cif->rtype->type == FFI_TYPE_STRUCT)) {
		ecif.rvalue = alloca(cif->rtype->size);
	} else {
		ecif.rvalue = rvalue;
	}

	switch (cif->abi)
	{
	case FFI_SYSV:
		ffi_call_SYSV(ffi_prep_args, &ecif, cif->bytes, cif->flags,
				ecif.rvalue, fn, cif->rtype->type, cif->rtype->size);
		break;
	default:
		FFI_ASSERT(0);
		break;
	}
}

void ffi_closure_call_SYSV(void* register_args, void* stack_args,
			ffi_closure* closure, void* rvalue,
			unsigned int* rtype, unsigned int* rsize)
{
	/* prepare arguments for closure call */
	ffi_cif* cif = closure->cif;
	ffi_type** arg_types = cif->arg_types;

	/* re-allocate data for the args. This needs to be done in order to keep
	 * multi-word objects (e.g. structs) in contiguous memory. Callers are not
	 * required to store the value of args in the lower 6 words in the stack
	 * (although they are allocated in the stack).
	 */
	char* stackclone = alloca(cif->bytes);
	void** avalue = alloca(cif->nargs * sizeof(void*));
	void* struct_rvalue = NULL;
	char* ptr = stackclone;
	int i;

	/* copy registers into stack clone */
	int registers_used = cif->bytes;
	if (registers_used > ARGS_REGISTER_SIZE) {
		registers_used = ARGS_REGISTER_SIZE;
	}
	memcpy(stackclone, register_args, registers_used);

	/* copy stack allocated args into stack clone */
	if (cif->bytes > ARGS_REGISTER_SIZE) {
		int stack_used = cif->bytes - ARGS_REGISTER_SIZE;
		memcpy(stackclone + ARGS_REGISTER_SIZE, stack_args, stack_used);
	}

	/* preserve struct type return pointer passing */
	if ((cif->rtype != NULL) && (cif->rtype->type == FFI_TYPE_STRUCT)) {
		struct_rvalue = *((void**)ptr);
		ptr += WORD_SIZE;
	}

	/* populate arg pointer list */
	for (i = 0; i < cif->nargs; i++)
	{
		switch (arg_types[i]->type)
		{
			case FFI_TYPE_SINT8:
			case FFI_TYPE_UINT8:
#ifdef __BIG_ENDIAN__
				avalue[i] = ptr + 3;
#else
				avalue[i] = ptr;
#endif
				break;
			case FFI_TYPE_SINT16:
			case FFI_TYPE_UINT16:
#ifdef __BIG_ENDIAN__
				avalue[i] = ptr + 2;
#else
				avalue[i] = ptr;
#endif
				break;
			case FFI_TYPE_STRUCT:
#if __BIG_ENDIAN__
				/*
				 * Work around strange ABI behaviour.
				 * (see info in ffi_prep_args)
				 */
				if (arg_types[i]->size < WORD_SIZE)
				{
				  memcpy (ptr, ptr + (WORD_SIZE - arg_types[i]->size), arg_types[i]->size);
				}
#endif
				avalue[i] = (void*)ptr;
				break;
			case FFI_TYPE_UINT64:
			case FFI_TYPE_SINT64:
			case FFI_TYPE_DOUBLE:
				avalue[i] = ptr;
				break;
			case FFI_TYPE_SINT32:
			case FFI_TYPE_UINT32:
			case FFI_TYPE_FLOAT:
			default:
				/* default 4-byte argument */
				avalue[i] = ptr;
				break;
		}
		ptr += WORD_FFI_ALIGN(arg_types[i]->size);
	}

	/* set the return type info passed back to the wrapper */
	*rsize = cif->rtype->size;
	*rtype = cif->rtype->type;
	if (struct_rvalue != NULL) {
		closure->fun(cif, struct_rvalue, avalue, closure->user_data);
		/* copy struct return pointer value into function return value */
		*((void**)rvalue) = struct_rvalue;
	} else {
		closure->fun(cif, rvalue, avalue, closure->user_data);
	}
}

ffi_status ffi_prep_closure_loc(
		ffi_closure* closure, ffi_cif* cif,
		void (*fun)(ffi_cif*, void*, void**, void*),
		void* user_data, void* codeloc)
{
	unsigned long* tramp = (unsigned long*)&(closure->tramp[0]);
	unsigned long cls = (unsigned long)codeloc;
	unsigned long fn = 0;
	unsigned long fn_closure_call_sysv = (unsigned long)ffi_closure_call_SYSV;

	closure->cif = cif;
	closure->fun = fun;
	closure->user_data = user_data;

	switch (cif->abi)
	{
	case FFI_SYSV:
		fn = (unsigned long)ffi_closure_SYSV;

		/* load r11 (temp) with fn */
		/* imm fn(upper) */
		tramp[0] = 0xb0000000 | ((fn >> 16) & 0xffff);
		/* addik r11, r0, fn(lower) */
		tramp[1] = 0x31600000 | (fn & 0xffff);

		/* load r12 (temp) with cls */
		/* imm cls(upper) */
		tramp[2] = 0xb0000000 | ((cls >> 16) & 0xffff);
		/* addik r12, r0, cls(lower) */
		tramp[3] = 0x31800000 | (cls & 0xffff);

		/* load r3 (temp) with ffi_closure_call_SYSV */
		/* imm fn_closure_call_sysv(upper) */
		tramp[4] = 0xb0000000 | ((fn_closure_call_sysv >> 16) & 0xffff);
		/* addik r3, r0, fn_closure_call_sysv(lower) */
		tramp[5] = 0x30600000 | (fn_closure_call_sysv & 0xffff);
		/* branch/jump to address stored in r11 (fn) */
		tramp[6] = 0x98085800; /* bra r11 */

		break;
	default:
		return FFI_BAD_ABI;
	}
	return FFI_OK;
}
