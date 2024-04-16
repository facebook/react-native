/* ----------------------------------------------------------------------
  ffi.c - Copyright (c) 2013 Imagination Technologies

  Meta Foreign Function Interface
  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  `Software''), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be included
  in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED `AS IS'', WITHOUT WARRANTY OF ANY KIND, EXPRESS
  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL SIMON POSNJAK BE LIABLE FOR ANY CLAIM, DAMAGES OR
  OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
  ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
----------------------------------------------------------------------- */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>

#define MIN(a,b) (((a) < (b)) ? (a) : (b))

/*
 * ffi_prep_args is called by the assembly routine once stack space has been
 * allocated for the function's arguments
 */

unsigned int ffi_prep_args(char *stack, extended_cif *ecif)
{
	register unsigned int i;
	register void **p_argv;
	register char *argp;
	register ffi_type **p_arg;

	argp = stack;

	/* Store return value */
	if ( ecif->cif->flags == FFI_TYPE_STRUCT ) {
		argp -= 4;
		*(void **) argp = ecif->rvalue;
	}

	p_argv = ecif->avalue;

	/* point to next location */
	for (i = ecif->cif->nargs, p_arg = ecif->cif->arg_types; (i != 0); i--, p_arg++, p_argv++)
	{
		size_t z;

		/* Move argp to address of argument */
		z = (*p_arg)->size;
		argp -= z;

		/* Align if necessary */
		argp = (char *) FFI_ALIGN_DOWN(FFI_ALIGN_DOWN(argp, (*p_arg)->alignment), 4);

		if (z < sizeof(int)) {
			z = sizeof(int);
			switch ((*p_arg)->type)
			{
			case FFI_TYPE_SINT8:
				*(signed int *) argp = (signed int)*(SINT8 *)(* p_argv);
				break;
			case FFI_TYPE_UINT8:
				*(unsigned int *) argp = (unsigned int)*(UINT8 *)(* p_argv);
				break;
			case FFI_TYPE_SINT16:
				*(signed int *) argp = (signed int)*(SINT16 *)(* p_argv);
				break;
			case FFI_TYPE_UINT16:
				*(unsigned int *) argp = (unsigned int)*(UINT16 *)(* p_argv);
			case FFI_TYPE_STRUCT:
				memcpy(argp, *p_argv, (*p_arg)->size);
				break;
			default:
				FFI_ASSERT(0);
			}
		} else if ( z == sizeof(int)) {
			*(unsigned int *) argp = (unsigned int)*(UINT32 *)(* p_argv);
		} else {
			memcpy(argp, *p_argv, z);
		}
	}

	/* return the size of the arguments to be passed in registers,
	   padded to an 8 byte boundary to preserve stack alignment */
	return FFI_ALIGN(MIN(stack - argp, 6*4), 8);
}

/* Perform machine dependent cif processing */
ffi_status ffi_prep_cif_machdep(ffi_cif *cif)
{
	ffi_type **ptr;
	unsigned i, bytes = 0;

	for (ptr = cif->arg_types, i = cif->nargs; i > 0; i--, ptr++) {
		if ((*ptr)->size == 0)
			return FFI_BAD_TYPEDEF;

		/* Perform a sanity check on the argument type, do this
		   check after the initialization.  */
		FFI_ASSERT_VALID_TYPE(*ptr);

		/* Add any padding if necessary */
		if (((*ptr)->alignment - 1) & bytes)
			bytes = FFI_ALIGN(bytes, (*ptr)->alignment);

		bytes += FFI_ALIGN((*ptr)->size, 4);
	}

	/* Ensure arg space is aligned to an 8-byte boundary */
	bytes = FFI_ALIGN(bytes, 8);

	/* Make space for the return structure pointer */
	if (cif->rtype->type == FFI_TYPE_STRUCT) {
		bytes += sizeof(void*);

		/* Ensure stack is aligned to an 8-byte boundary */
		bytes = FFI_ALIGN(bytes, 8);
	}

	cif->bytes = bytes;

	/* Set the return type flag */
	switch (cif->rtype->type) {
	case FFI_TYPE_VOID:
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
		cif->flags = (unsigned) cif->rtype->type;
		break;
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
		cif->flags = (unsigned) FFI_TYPE_SINT64;
		break;
	case FFI_TYPE_STRUCT:
		/* Meta can store return values which are <= 64 bits */
		if (cif->rtype->size <= 4)
			/* Returned to D0Re0 as 32-bit value */
			cif->flags = (unsigned)FFI_TYPE_INT;
		else if ((cif->rtype->size > 4) && (cif->rtype->size <= 8))
			/* Returned valued is stored to D1Re0|R0Re0 */
			cif->flags = (unsigned)FFI_TYPE_DOUBLE;
		else
			/* value stored in memory */
			cif->flags = (unsigned)FFI_TYPE_STRUCT;
		break;
	default:
		cif->flags = (unsigned)FFI_TYPE_INT;
		break;
	}
	return FFI_OK;
}

extern void ffi_call_SYSV(void (*fn)(void), extended_cif *, unsigned, unsigned, double *);

/*
 * Exported in API. Entry point
 * cif -> ffi_cif object
 * fn -> function pointer
 * rvalue -> pointer to return value
 * avalue -> vector of void * pointers pointing to memory locations holding the
 * arguments
 */
void ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
	extended_cif ecif;

	int small_struct = (((cif->flags == FFI_TYPE_INT) || (cif->flags == FFI_TYPE_DOUBLE)) && (cif->rtype->type == FFI_TYPE_STRUCT));
	ecif.cif = cif;
	ecif.avalue = avalue;

	double temp;

	/*
	 * If the return value is a struct and we don't have a return value address
	 * then we need to make one
	 */

	if ((rvalue == NULL ) && (cif->flags == FFI_TYPE_STRUCT))
		ecif.rvalue = alloca(cif->rtype->size);
	else if (small_struct)
		ecif.rvalue = &temp;
	else
		ecif.rvalue = rvalue;

	switch (cif->abi) {
	case FFI_SYSV:
		ffi_call_SYSV(fn, &ecif, cif->bytes, cif->flags, ecif.rvalue);
		break;
	default:
		FFI_ASSERT(0);
		break;
	}

	if (small_struct)
		memcpy (rvalue, &temp, cif->rtype->size);
}

/* private members */

static void ffi_prep_incoming_args_SYSV (char *, void **, void **,
	ffi_cif*, float *);

void ffi_closure_SYSV (ffi_closure *);

/* Do NOT change that without changing the FFI_TRAMPOLINE_SIZE */
extern unsigned int ffi_metag_trampoline[10]; /* 10 instructions */

/* end of private members */

/*
 * __tramp: trampoline memory location
 * __fun: assembly routine
 * __ctx: memory location for wrapper
 *
 * At this point, tramp[0] == __ctx !
 */
void ffi_init_trampoline(unsigned char *__tramp, unsigned int __fun, unsigned int __ctx) {
	memcpy (__tramp, ffi_metag_trampoline, sizeof(ffi_metag_trampoline));
	*(unsigned int*) &__tramp[40] = __ctx;
	*(unsigned int*) &__tramp[44] = __fun;
	/* This will flush the instruction cache */
	__builtin_meta2_cachewd(&__tramp[0], 1);
	__builtin_meta2_cachewd(&__tramp[47], 1);
}



/* the cif must already be prepared */

ffi_status
ffi_prep_closure_loc (ffi_closure *closure,
	ffi_cif* cif,
	void (*fun)(ffi_cif*,void*,void**,void*),
	void *user_data,
	void *codeloc)
{
	void (*closure_func)(ffi_closure*) = NULL;

	if (cif->abi == FFI_SYSV)
		closure_func = &ffi_closure_SYSV;
	else
		return FFI_BAD_ABI;

	ffi_init_trampoline(
		(unsigned char*)&closure->tramp[0],
		(unsigned int)closure_func,
		(unsigned int)codeloc);

	closure->cif = cif;
	closure->user_data = user_data;
	closure->fun = fun;

	return FFI_OK;
}


/* This function is jumped to by the trampoline */
unsigned int ffi_closure_SYSV_inner (closure, respp, args, vfp_args)
	ffi_closure *closure;
	void **respp;
	void *args;
	void *vfp_args;
{
	ffi_cif *cif;
	void **arg_area;

	cif = closure->cif;
	arg_area = (void**) alloca (cif->nargs * sizeof (void*));

	/*
	 * This call will initialize ARG_AREA, such that each
	 * element in that array points to the corresponding
	 * value on the stack; and if the function returns
	 * a structure, it will re-set RESP to point to the
	 * structure return address.
	 */
	ffi_prep_incoming_args_SYSV(args, respp, arg_area, cif, vfp_args);

	(closure->fun) ( cif, *respp, arg_area, closure->user_data);

	return cif->flags;
}

static void ffi_prep_incoming_args_SYSV(char *stack, void **rvalue,
	void **avalue, ffi_cif *cif,
	float *vfp_stack)
{
	register unsigned int i;
	register void **p_argv;
	register char *argp;
	register ffi_type **p_arg;

	/* stack points to original arguments */
	argp = stack;

	/* Store return value */
	if ( cif->flags == FFI_TYPE_STRUCT ) {
		argp -= 4;
		*rvalue = *(void **) argp;
	}

	p_argv = avalue;

	for (i = cif->nargs, p_arg = cif->arg_types; (i != 0); i--, p_arg++) {
		size_t z;
		size_t alignment;

		alignment = (*p_arg)->alignment;
		if (alignment < 4)
			alignment = 4;
		if ((alignment - 1) & (unsigned)argp)
			argp = (char *) FFI_ALIGN(argp, alignment);

		z = (*p_arg)->size;
		*p_argv = (void*) argp;
		p_argv++;
		argp -= z;
	}
	return;
}
