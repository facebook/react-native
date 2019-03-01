#include "fbsystrace.h"

#include <dlfcn.h>

void *(*ATrace_beginSection) (const char* sectionName) = nullptr;
void *(*ATrace_endSection) (void) = nullptr;
bool *(*ATrace_isEnabled) (void) = nullptr;

void initializeTracing()
{
    // Native Trace API is supported in NDK API level 23.. Hence reflecting.
    void *lib = dlopen("libandroid.so", RTLD_NOW | RTLD_LOCAL);
    if (lib != nullptr) {
        // Retrieve function pointers from shared object.

        typedef void *(*fp_ATrace_beginSection) (const char* sectionName);
        typedef void *(*fp_ATrace_endSection) (void);
        typedef bool *(*fp_ATrace_isEnabled) (void);

        ATrace_beginSection =
                reinterpret_cast<fp_ATrace_beginSection >(
                        dlsym(lib, "ATrace_beginSection"));
        ATrace_endSection =
                reinterpret_cast<fp_ATrace_endSection >(
                        dlsym(lib, "ATrace_endSection"));
        ATrace_isEnabled =
                reinterpret_cast<fp_ATrace_isEnabled >(
                        dlsym(lib, "ATrace_isEnabled"));
    }

    if(!ATrace_beginSection || !ATrace_endSection || !ATrace_isEnabled) std::terminate();
}

// We assume that this is always called for begin_section
void fbsystrace_trace_raw(const char* buffer, size_t)
{
    if(!ATrace_beginSection) {
        initializeTracing();
    }

    // We are currently assuming that the caller provide null terminated string. 
    if(buffer)
        ATrace_beginSection(buffer);
}

void fbsystrace_end_section(uint64_t /*tag*/)
{
    if(!ATrace_endSection) {
        initializeTracing();
    }

    ATrace_endSection();
}

bool fbsystrace_is_tracing(uint64_t /*tag*/)
{
    if(!ATrace_isEnabled) {
        initializeTracing();
    }

    return ATrace_isEnabled();
}

void fbsystrace_end_async_flow(uint64_t tag, const char* name, int callId)
{
    // No-OP
}
