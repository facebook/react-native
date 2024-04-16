/* -----------------------------------------------------------------------
   tramp.c - Copyright (c) 2020 Madhavan T. Venkataraman
             Copyright (c) 2022 Anthony Green

   API and support functions for managing statically defined closure
   trampolines.

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

#include <fficonfig.h>

#ifdef FFI_EXEC_STATIC_TRAMP

/* -------------------------- Headers and Definitions ---------------------*/
/*
 * Add support for other OSes later. For now, it is just Linux and Cygwin.
 */

#if defined (__linux__) || defined (__CYGWIN__)
#ifdef __linux__
#define _GNU_SOURCE 1
#endif

#include <ffi.h>
#include <ffi_common.h>

#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdint.h>
#include <fcntl.h>
#include <pthread.h>
#include <sys/mman.h>
#include <tramp.h>
#ifdef __linux__
#include <linux/limits.h>
#include <linux/types.h>
#endif
#ifdef __CYGWIN__
#include <limits.h>
#endif
#endif

/*
 * Each architecture defines static code for a trampoline code table. The
 * trampoline code table is mapped into the address space of a process.
 *
 * The following architecture specific function returns:
 *
 *	- the address of the trampoline code table in the text segment
 *	- the size of each trampoline in the trampoline code table
 *	- the size of the mapping for the whole trampoline code table
 */
void __attribute__((weak)) *ffi_tramp_arch (size_t *tramp_size,
  size_t *map_size);

/* ------------------------- Trampoline Data Structures --------------------*/

struct tramp;

/*
 * Trampoline table. Manages one trampoline code table and one trampoline
 * parameter table.
 *
 * prev, next	Links in the global trampoline table list.
 * code_table	Trampoline code table mapping.
 * parm_table	Trampoline parameter table mapping.
 * array	Array of trampolines malloced.
 * free		List of free trampolines.
 * nfree	Number of free trampolines.
 */
struct tramp_table
{
  struct tramp_table *prev;
  struct tramp_table *next;
  void *code_table;
  void *parm_table;
  struct tramp *array;
  struct tramp *free;
  int nfree;
};

/*
 * Parameters for each trampoline.
 *
 * data
 *	Data for the target code that the trampoline jumps to.
 * target
 *	Target code that the trampoline jumps to.
 */
struct tramp_parm
{
  void *data;
  void *target;
};

/*
 * Trampoline structure for each trampoline.
 *
 * prev, next	Links in the trampoline free list of a trampoline table.
 * table	Trampoline table to which this trampoline belongs.
 * code		Address of this trampoline in the code table mapping.
 * parm		Address of this trampoline's parameters in the parameter
 *		table mapping.
 */
struct tramp
{
  struct tramp *prev;
  struct tramp *next;
  struct tramp_table *table;
  void *code;
  struct tramp_parm *parm;
};

enum tramp_globals_status {
	TRAMP_GLOBALS_UNINITIALIZED = 0,
	TRAMP_GLOBALS_PASSED,
	TRAMP_GLOBALS_FAILED,
};

/*
 * Trampoline globals.
 *
 * fd
 *	File descriptor of binary file that contains the trampoline code table.
 * offset
 *	Offset of the trampoline code table in that file.
 * text
 *	Address of the trampoline code table in the text segment.
 * map_size
 *	Size of the trampoline code table mapping.
 * size
 *	Size of one trampoline in the trampoline code table.
 * ntramp
 *	Total number of trampolines in the trampoline code table.
 * free_tables
 *	List of trampoline tables that contain free trampolines.
 * nfree_tables
 *	Number of trampoline tables that contain free trampolines.
 * status
 *	Initialization status.
 */
struct tramp_globals
{
  int fd;
  off_t offset;
  void *text;
  size_t map_size;
  size_t size;
  int ntramp;
  struct tramp_table *free_tables;
  int nfree_tables;
  enum tramp_globals_status status;
};

static struct tramp_globals tramp_globals;

/* --------------------- Trampoline File Initialization --------------------*/

/*
 * The trampoline file is the file used to map the trampoline code table into
 * the address space of a process. There are two ways to get this file:
 *
 * - From the OS. E.g., on Linux, /proc/<pid>/maps lists all the memory
 *   mappings for <pid>. For file-backed mappings, maps supplies the file name
 *   and the file offset. Using this, we can locate the mapping that maps
 *   libffi and get the path to the libffi binary. And, we can compute the
 *   offset of the trampoline code table within that binary.
 *
 * - Else, if we can create a temporary file, we can write the trampoline code
 *   table from the text segment into the temporary file.
 *
 * The first method is the preferred one. If the OS security subsystem
 * disallows mapping unsigned files with PROT_EXEC, then the second method
 * will fail.
 *
 * If an OS allows the trampoline code table in the text segment to be
 * directly remapped (e.g., MACH vm_remap ()), then we don't need the
 * trampoline file.
 */
static int tramp_table_alloc (void);

#if defined (__linux__) || defined (__CYGWIN__)

static int
ffi_tramp_get_libffi (void)
{
  FILE *fp;
  char file[PATH_MAX], line[PATH_MAX+100], perm[10], dev[10];
  unsigned long start, end, offset, inode;
  uintptr_t addr = (uintptr_t) tramp_globals.text;
  int nfields, found;

  snprintf (file, PATH_MAX, "/proc/%d/maps", getpid());
  fp = fopen (file, "r");
  if (fp == NULL)
    return 0;

  found = 0;
  while (feof (fp) == 0) {
    if (fgets (line, sizeof (line), fp) == 0)
      break;

    nfields = sscanf (line, "%lx-%lx %9s %lx %9s %ld %s",
      &start, &end, perm, &offset, dev, &inode, file);
    if (nfields != 7)
      continue;

    if (addr >= start && addr < end) {
      tramp_globals.offset = offset + (addr - start);
      found = 1;
      break;
    }
  }
  fclose (fp);

  if (!found)
    return 0;

  tramp_globals.fd = open (file, O_RDONLY);
  if (tramp_globals.fd == -1)
    return 0;

  /*
   * Allocate a trampoline table just to make sure that the trampoline code
   * table can be mapped.
   */
  if (!tramp_table_alloc ())
    {
      close (tramp_globals.fd);
      tramp_globals.fd = -1;
      return 0;
    }
  return 1;
}

#endif /* defined (__linux__) || defined (__CYGWIN__) */

#if defined (__linux__) || defined (__CYGWIN__)

static int
ffi_tramp_get_temp_file (void)
{
  ssize_t count;

  tramp_globals.offset = 0;
  tramp_globals.fd = open_temp_exec_file ();

  /*
   * Write the trampoline code table into the temporary file and allocate a
   * trampoline table to make sure that the temporary file can be mapped.
   */
  count = write(tramp_globals.fd, tramp_globals.text, tramp_globals.map_size);
  if (count >=0 && (size_t)count == tramp_globals.map_size && tramp_table_alloc ())
    return 1;

  close (tramp_globals.fd);
  tramp_globals.fd = -1;
  return 0;
}

#endif /* defined (__linux__) || defined (__CYGWIN__) */

/* ------------------------ OS-specific Initialization ----------------------*/

#if defined (__linux__) || defined (__CYGWIN__)

static int
ffi_tramp_init_os (void)
{
  if (ffi_tramp_get_libffi ())
    return 1;
  return ffi_tramp_get_temp_file ();
}

#endif /* defined (__linux__) || defined (__CYGWIN__) */

/* --------------------------- OS-specific Locking -------------------------*/

#if defined (__linux__) || defined (__CYGWIN__)

static pthread_mutex_t tramp_globals_mutex = PTHREAD_MUTEX_INITIALIZER;

static void
ffi_tramp_lock(void)
{
  pthread_mutex_lock (&tramp_globals_mutex);
}

static void
ffi_tramp_unlock()
{
  pthread_mutex_unlock (&tramp_globals_mutex);
}

#endif /* defined (__linux__) || defined (__CYGWIN__) */

/* ------------------------ OS-specific Memory Mapping ----------------------*/

/*
 * Create a trampoline code table mapping and a trampoline parameter table
 * mapping. The two mappings must be adjacent to each other for PC-relative
 * access.
 *
 * For each trampoline in the code table, there is a corresponding parameter
 * block in the parameter table. The size of the parameter block is the same
 * as the size of the trampoline. This means that the parameter block is at
 * a fixed offset from its trampoline making it easy for a trampoline to find
 * its parameters using PC-relative access.
 *
 * The parameter block will contain a struct tramp_parm. This means that
 * sizeof (struct tramp_parm) cannot exceed the size of a parameter block.
 */

#if defined (__linux__) || defined (__CYGWIN__)

static int
tramp_table_map (struct tramp_table *table)
{
  char *addr;

  /*
   * Create an anonymous mapping twice the map size. The top half will be used
   * for the code table. The bottom half will be used for the parameter table.
   */
  addr = mmap (NULL, tramp_globals.map_size * 2, PROT_READ | PROT_WRITE,
    MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
  if (addr == MAP_FAILED)
    return 0;

  /*
   * Replace the top half of the anonymous mapping with the code table mapping.
   */
  table->code_table = mmap (addr, tramp_globals.map_size, PROT_READ | PROT_EXEC,
    MAP_PRIVATE | MAP_FIXED, tramp_globals.fd, tramp_globals.offset);
  if (table->code_table == MAP_FAILED)
    {
      (void) munmap (addr, tramp_globals.map_size * 2);
      return 0;
    }
  table->parm_table = table->code_table + tramp_globals.map_size;
  return 1;
}

static void
tramp_table_unmap (struct tramp_table *table)
{
  (void) munmap (table->code_table, tramp_globals.map_size);
  (void) munmap (table->parm_table, tramp_globals.map_size);
}

#endif /* defined (__linux__) || defined (__CYGWIN__) */

/* ------------------------ Trampoline Initialization ----------------------*/

/*
 * Initialize the static trampoline feature.
 */
static int
ffi_tramp_init (void)
{
  long page_size;

  if (tramp_globals.status == TRAMP_GLOBALS_PASSED)
    return 1;

  if (tramp_globals.status == TRAMP_GLOBALS_FAILED)
    return 0;

  if (ffi_tramp_arch == NULL)
    {
      tramp_globals.status = TRAMP_GLOBALS_FAILED;
      return 0;
    }

  tramp_globals.free_tables = NULL;
  tramp_globals.nfree_tables = 0;

  /*
   * Get trampoline code table information from the architecture.
   */
  tramp_globals.text = ffi_tramp_arch (&tramp_globals.size,
    &tramp_globals.map_size);
  tramp_globals.ntramp = tramp_globals.map_size / tramp_globals.size;

  page_size = sysconf (_SC_PAGESIZE);
  if (page_size >= 0 && (size_t)page_size > tramp_globals.map_size)
    return 0;

  if (ffi_tramp_init_os ())
    {
      tramp_globals.status = TRAMP_GLOBALS_PASSED;
      return 1;
    }

  tramp_globals.status = TRAMP_GLOBALS_FAILED;
  return 0;
}

/* ---------------------- Trampoline Table functions ---------------------- */

/* This code assumes that malloc () is available on all OSes. */

static void tramp_add (struct tramp *tramp);

/*
 * Allocate and initialize a trampoline table.
 */
static int
tramp_table_alloc (void)
{
  struct tramp_table *table;
  struct tramp *tramp_array, *tramp;
  size_t size;
  char *code, *parm;
  int i;

  /*
   * If we already have tables with free trampolines, there is no need to
   * allocate a new table.
   */
  if (tramp_globals.nfree_tables > 0)
    return 1;

  /*
   * Allocate a new trampoline table structure.
   */
  table = malloc (sizeof (*table));
  if (table == NULL)
    return 0;

  /*
   * Allocate new trampoline structures.
   */
  tramp_array = malloc (sizeof (*tramp) * tramp_globals.ntramp);
  if (tramp_array == NULL)
    goto free_table;

  /*
   * Map a code table and a parameter table into the caller's address space.
   */
  if (!tramp_table_map (table))
    {
      /*
       * Failed to map the code and parameter tables.
       */
      goto free_tramp_array;
    }

  /*
   * Initialize the trampoline table.
   */
  table->array = tramp_array;
  table->free = NULL;
  table->nfree = 0;

  /*
   * Populate the trampoline table free list. This will also add the trampoline
   * table to the global list of trampoline tables.
   */
  size = tramp_globals.size;
  code = table->code_table;
  parm = table->parm_table;
  for (i = 0; i < tramp_globals.ntramp; i++)
    {
      tramp = &tramp_array[i];
      tramp->table = table;
      tramp->code = code;
      tramp->parm = (struct tramp_parm *) parm;
      tramp_add (tramp);

      code += size;
      parm += size;
    }
  /* Success */
  return 1;

/* Failure */
free_tramp_array:
  free (tramp_array);
free_table:
  free (table);
  return 0;
}

/*
 * Free a trampoline table.
 */
static void
tramp_table_free (struct tramp_table *table)
{
  tramp_table_unmap (table);
  free (table->array);
  free (table);
}

/*
 * Add a new trampoline table to the global table list.
 */
static void
tramp_table_add (struct tramp_table *table)
{
  table->next = tramp_globals.free_tables;
  table->prev = NULL;
  if (tramp_globals.free_tables != NULL)
    tramp_globals.free_tables->prev = table;
  tramp_globals.free_tables = table;
  tramp_globals.nfree_tables++;
}

/*
 * Delete a trampoline table from the global table list.
 */
static void
tramp_table_del (struct tramp_table *table)
{
  tramp_globals.nfree_tables--;
  if (table->prev != NULL)
    table->prev->next = table->next;
  if (table->next != NULL)
    table->next->prev = table->prev;
  if (tramp_globals.free_tables == table)
    tramp_globals.free_tables = table->next;
}

/* ------------------------- Trampoline functions ------------------------- */

/*
 * Add a trampoline to its trampoline table.
 */
static void
tramp_add (struct tramp *tramp)
{
  struct tramp_table *table = tramp->table;

  tramp->next = table->free;
  tramp->prev = NULL;
  if (table->free != NULL)
    table->free->prev = tramp;
  table->free = tramp;
  table->nfree++;

  if (table->nfree == 1)
    tramp_table_add (table);

  /*
   * We don't want to keep too many free trampoline tables lying around.
   */
  if (table->nfree == tramp_globals.ntramp &&
    tramp_globals.nfree_tables > 1)
    {
      tramp_table_del (table);
      tramp_table_free (table);
    }
}

/*
 * Remove a trampoline from its trampoline table.
 */
static void
tramp_del (struct tramp *tramp)
{
  struct tramp_table *table = tramp->table;

  table->nfree--;
  if (tramp->prev != NULL)
    tramp->prev->next = tramp->next;
  if (tramp->next != NULL)
    tramp->next->prev = tramp->prev;
  if (table->free == tramp)
    table->free = tramp->next;

  if (table->nfree == 0)
    tramp_table_del (table);
}

/* ------------------------ Trampoline API functions ------------------------ */

int
ffi_tramp_is_supported(void)
{
  int ret;

  ffi_tramp_lock();
  ret = ffi_tramp_init ();
  ffi_tramp_unlock();
  return ret;
}

/*
 * Allocate a trampoline and return its opaque address.
 */
void *
ffi_tramp_alloc (int flags)
{
  struct tramp *tramp;

  ffi_tramp_lock();

  if (!ffi_tramp_init () || flags != 0)
    {
      ffi_tramp_unlock();
      return NULL;
    }

  if (!tramp_table_alloc ())
    {
      ffi_tramp_unlock();
      return NULL;
    }

  tramp = tramp_globals.free_tables->free;
  tramp_del (tramp);

  ffi_tramp_unlock();

  return tramp;
}

/*
 * Set the parameters for a trampoline.
 */
void
ffi_tramp_set_parms (void *arg, void *target, void *data)
{
  struct tramp *tramp = arg;

  ffi_tramp_lock();
  tramp->parm->target = target;
  tramp->parm->data = data;
  ffi_tramp_unlock();
}

/*
 * Get the invocation address of a trampoline.
 */
void *
ffi_tramp_get_addr (void *arg)
{
  struct tramp *tramp = arg;
  void *addr;

  ffi_tramp_lock();
  addr = tramp->code;
  ffi_tramp_unlock();

  return addr;
}

/*
 * Free a trampoline.
 */
void
ffi_tramp_free (void *arg)
{
  struct tramp *tramp = arg;

  ffi_tramp_lock();
  tramp_add (tramp);
  ffi_tramp_unlock();
}

/* ------------------------------------------------------------------------- */

#else /* !FFI_EXEC_STATIC_TRAMP */

#include <stddef.h>

int
ffi_tramp_is_supported(void)
{
  return 0;
}

void *
ffi_tramp_alloc (int flags)
{
  return NULL;
}

void
ffi_tramp_set_parms (void *arg, void *target, void *data)
{
}

void *
ffi_tramp_get_addr (void *arg)
{
  return NULL;
}

void
ffi_tramp_free (void *arg)
{
}

#endif /* FFI_EXEC_STATIC_TRAMP */
