#pragma once

#include <stdint.h>
#include <string.h>
#include <string>

// No-OP for now being.
#define FBSYSTRACE_UNLIKELY(x) x
#define FBSYSTRACE_LIKELY(x) x

#define FBSYSTRACE_MAX_MESSAGE_LENGTH 1024
#define FBSYSTRACE_MAX_SECTION_NAME_LENGTH 1024

#define TRACE_TAG_REACT_CXX_BRIDGE 0
#define TRACE_TAG_REACT_APPS 0

// We assume that this is always called for begin_section
void fbsystrace_trace_raw(const char* buffer, size_t length=0);

void fbsystrace_end_section(uint64_t tag);

bool fbsystrace_is_tracing(uint64_t tag);

void fbsystrace_end_async_flow(uint64_t tag, const char* name, int callId);

// Currently, not supporting the async methods as android's ASystrace* APIs currently does 
// officially support only calling from the same stackframe.. Calling across may work but
// it may result in non deterministic behaviour as the end calls would try matching the last begin ..

namespace fbsystrace {

struct FbSystraceSection{
    
    std::string m_traceMessage;
    uint64_t m_tag;

    // We assume that arguments are null terminated .. 

    void init(std::string v) {
        v.append("~~");
        v.append(m_traceMessage);

        fbsystrace_trace_raw(v.c_str());
    }

    template<typename Arg, typename... ConvertsToStringPiece>
    void init(std::string&& v, Arg v1, ConvertsToStringPiece&&... rest) {
        m_traceMessage.append("#");
        m_traceMessage.append(v1);
        init(std::move(v), std::forward<ConvertsToStringPiece>(rest)...);
    }

    template<typename... ConvertsToStringPiece>
    FbSystraceSection(uint64_t tag, std::string&& v, ConvertsToStringPiece&&... rest) 
        :m_tag(tag)
    {
        init(std::move(v), std::forward<ConvertsToStringPiece>(rest)... );
    }
    
    ~FbSystraceSection() {
        fbsystrace_end_section(m_tag);
    }
};

struct FbSystraceAsyncFlow{
    static void begin(uint64_t tag, const char* name, int cookie) {}
    static void end(uint64_t tag, const char* name, int cookie) {}
};

}