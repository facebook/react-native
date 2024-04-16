/* -----------------------------------------------------------------------
   java_raw_api.c - Copyright (c) 1999, 2007, 2008  Red Hat, Inc.

   Cloned from raw_api.c

   Raw_api.c author: Kresten Krab Thorup <krab@gnu.org>
   Java_raw_api.c author: Hans-J. Boehm <hboehm@hpl.hp.com>

   $Id $

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

/* This defines a Java- and 64-bit specific variant of the raw API.	*/
/* It assumes that "raw" argument blocks look like Java stacks on a	*/
/* 64-bit machine.  Arguments that can be stored in a single stack	*/
/* stack slots (longs, doubles) occupy 128 bits, but only the first	*/
/* 64 bits are actually used.						*/

#include <ffi.h>
#include <ffi_common.h>
#include <stdlib.h>

#if !defined(NO_JAVA_RAW_API)

size_t
ffi_java_raw_size (ffi_cif *cif)
{
  size_t result = 0;
  int i;

  ffi_type **at = cif->arg_types;

  for (i = cif->nargs-1; i >= 0; i--, at++)
    {
      switch((*at) -> type) {
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_DOUBLE:
	  result += 2 * FFI_SIZEOF_JAVA_RAW;
	  break;
	case FFI_TYPE_STRUCT:
	  /* No structure parameters in Java.	*/
	  abort();
	case FFI_TYPE_COMPLEX:
	  /* Not supported yet.  */
	  abort();
	default:
	  result += FFI_SIZEOF_JAVA_RAW;
      }
    }

  return result;
}


void
ffi_java_raw_to_ptrarray (ffi_cif *cif, ffi_java_raw *raw, void **args)
{
  unsigned i;
  ffi_type **tp = cif->arg_types;

#if WORDS_BIGENDIAN

  for (i = 0; i < cif->nargs; i++, tp++, args++)
    {
      switch ((*tp)->type)
	{
	case FFI_TYPE_UINT8:
	case FFI_TYPE_SINT8:
	  *args = (void*) ((char*)(raw++) + 3);
	  break;

	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT16:
	  *args = (void*) ((char*)(raw++) + 2);
	  break;

#if FFI_SIZEOF_JAVA_RAW == 8
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_DOUBLE:
	  *args = (void *)raw;
	  raw += 2;
	  break;
#endif

	case FFI_TYPE_POINTER:
	  *args = (void*) &(raw++)->ptr;
	  break;

	case FFI_TYPE_COMPLEX:
	  /* Not supported yet.  */
	  abort();

	default:
	  *args = raw;
	  raw +=
	    FFI_ALIGN ((*tp)->size, sizeof(ffi_java_raw)) / sizeof(ffi_java_raw);
	}
    }

#else /* WORDS_BIGENDIAN */

#if !PDP

  /* then assume little endian */
  for (i = 0; i < cif->nargs; i++, tp++, args++)
    {
#if FFI_SIZEOF_JAVA_RAW == 8
      switch((*tp)->type) {
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_DOUBLE:
	  *args = (void*) raw;
	  raw += 2;
	  break;
	case FFI_TYPE_COMPLEX:
	  /* Not supported yet.  */
	  abort();
	default:
	  *args = (void*) raw++;
      }
#else /* FFI_SIZEOF_JAVA_RAW != 8 */
	*args = (void*) raw;
	raw +=
	  FFI_ALIGN ((*tp)->size, sizeof(ffi_java_raw)) / sizeof(ffi_java_raw);
#endif /* FFI_SIZEOF_JAVA_RAW == 8 */
    }

#else
#error "pdp endian not supported"
#endif /* ! PDP */

#endif /* WORDS_BIGENDIAN */
}

void
ffi_java_ptrarray_to_raw (ffi_cif *cif, void **args, ffi_java_raw *raw)
{
  unsigned i;
  ffi_type **tp = cif->arg_types;

  for (i = 0; i < cif->nargs; i++, tp++, args++)
    {
      switch ((*tp)->type)
	{
	case FFI_TYPE_UINT8:
#if WORDS_BIGENDIAN
	  *(UINT32*)(raw++) = *(UINT8*) (*args);
#else
	  (raw++)->uint = *(UINT8*) (*args);
#endif
	  break;

	case FFI_TYPE_SINT8:
#if WORDS_BIGENDIAN
	  *(SINT32*)(raw++) = *(SINT8*) (*args);
#else
	  (raw++)->sint = *(SINT8*) (*args);
#endif
	  break;

	case FFI_TYPE_UINT16:
#if WORDS_BIGENDIAN
	  *(UINT32*)(raw++) = *(UINT16*) (*args);
#else
	  (raw++)->uint = *(UINT16*) (*args);
#endif
	  break;

	case FFI_TYPE_SINT16:
#if WORDS_BIGENDIAN
	  *(SINT32*)(raw++) = *(SINT16*) (*args);
#else
	  (raw++)->sint = *(SINT16*) (*args);
#endif
	  break;

	case FFI_TYPE_UINT32:
#if WORDS_BIGENDIAN
	  *(UINT32*)(raw++) = *(UINT32*) (*args);
#else
	  (raw++)->uint = *(UINT32*) (*args);
#endif
	  break;

	case FFI_TYPE_SINT32:
#if WORDS_BIGENDIAN
	  *(SINT32*)(raw++) = *(SINT32*) (*args);
#else
	  (raw++)->sint = *(SINT32*) (*args);
#endif
	  break;

	case FFI_TYPE_FLOAT:
	  (raw++)->flt = *(FLOAT32*) (*args);
	  break;

#if FFI_SIZEOF_JAVA_RAW == 8
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_DOUBLE:
	  raw->uint = *(UINT64*) (*args);
	  raw += 2;
	  break;
#endif

	case FFI_TYPE_POINTER:
	  (raw++)->ptr = **(void***) args;
	  break;

	default:
#if FFI_SIZEOF_JAVA_RAW == 8
	  FFI_ASSERT(0);	/* Should have covered all cases */
#else
	  memcpy ((void*) raw->data, (void*)*args, (*tp)->size);
	  raw +=
	    FFI_ALIGN ((*tp)->size, sizeof(ffi_java_raw)) / sizeof(ffi_java_raw);
#endif
	}
    }
}

#if !FFI_NATIVE_RAW_API

static void
ffi_java_rvalue_to_raw (ffi_cif *cif, void *rvalue)
{
#if WORDS_BIGENDIAN && FFI_SIZEOF_ARG == 8
  switch (cif->rtype->type)
    {
    case FFI_TYPE_UINT8:
    case FFI_TYPE_UINT16:
    case FFI_TYPE_UINT32:
      *(UINT64 *)rvalue <<= 32;
      break;

    case FFI_TYPE_SINT8:
    case FFI_TYPE_SINT16:
    case FFI_TYPE_SINT32:
    case FFI_TYPE_INT:
#if FFI_SIZEOF_JAVA_RAW == 4
    case FFI_TYPE_POINTER:
#endif
      *(SINT64 *)rvalue <<= 32;
      break;

    case FFI_TYPE_COMPLEX:
      /* Not supported yet.  */
      abort();

    default:
      break;
    }
#endif
}

static void
ffi_java_raw_to_rvalue (ffi_cif *cif, void *rvalue)
{
#if WORDS_BIGENDIAN && FFI_SIZEOF_ARG == 8
  switch (cif->rtype->type)
    {
    case FFI_TYPE_UINT8:
    case FFI_TYPE_UINT16:
    case FFI_TYPE_UINT32:
      *(UINT64 *)rvalue >>= 32;
      break;

    case FFI_TYPE_SINT8:
    case FFI_TYPE_SINT16:
    case FFI_TYPE_SINT32:
    case FFI_TYPE_INT:
      *(SINT64 *)rvalue >>= 32;
      break;

    case FFI_TYPE_COMPLEX:
      /* Not supported yet.  */
      abort();

    default:
      break;
    }
#endif
}

/* This is a generic definition of ffi_raw_call, to be used if the
 * native system does not provide a machine-specific implementation.
 * Having this, allows code to be written for the raw API, without
 * the need for system-specific code to handle input in that format;
 * these following couple of functions will handle the translation forth
 * and back automatically. */

void ffi_java_raw_call (ffi_cif *cif, void (*fn)(void), void *rvalue,
			ffi_java_raw *raw)
{
  void **avalue = (void**) alloca (cif->nargs * sizeof (void*));
  ffi_java_raw_to_ptrarray (cif, raw, avalue);
  ffi_call (cif, fn, rvalue, avalue);
  ffi_java_rvalue_to_raw (cif, rvalue);
}

#if FFI_CLOSURES		/* base system provides closures */

static void
ffi_java_translate_args (ffi_cif *cif, void *rvalue,
		    void **avalue, void *user_data)
{
  ffi_java_raw *raw = (ffi_java_raw*)alloca (ffi_java_raw_size (cif));
  ffi_raw_closure *cl = (ffi_raw_closure*)user_data;

  ffi_java_ptrarray_to_raw (cif, avalue, raw);
  (*cl->fun) (cif, rvalue, (ffi_raw*)raw, cl->user_data);
  ffi_java_raw_to_rvalue (cif, rvalue);
}

ffi_status
ffi_prep_java_raw_closure_loc (ffi_java_raw_closure* cl,
			       ffi_cif *cif,
			       void (*fun)(ffi_cif*,void*,ffi_java_raw*,void*),
			       void *user_data,
			       void *codeloc)
{
  ffi_status status;

  status = ffi_prep_closure_loc ((ffi_closure*) cl,
				 cif,
				 &ffi_java_translate_args,
				 codeloc,
				 codeloc);
  if (status == FFI_OK)
    {
      cl->fun       = fun;
      cl->user_data = user_data;
    }

  return status;
}

/* Again, here is the generic version of ffi_prep_raw_closure, which
 * will install an intermediate "hub" for translation of arguments from
 * the pointer-array format, to the raw format */

ffi_status
ffi_prep_java_raw_closure (ffi_java_raw_closure* cl,
			   ffi_cif *cif,
			   void (*fun)(ffi_cif*,void*,ffi_java_raw*,void*),
			   void *user_data)
{
  return ffi_prep_java_raw_closure_loc (cl, cif, fun, user_data, cl);
}

#endif /* FFI_CLOSURES */
#endif /* !FFI_NATIVE_RAW_API */
#endif /* !NO_JAVA_RAW_API */
