// Copyright 2004-present Facebook. All Rights Reserved.

#include <fb/lyra.h>

#include <ios>
#include <memory>
#include <vector>

#include <dlfcn.h>
#include <unwind.h>

using namespace std;

namespace facebook {
namespace lyra {

namespace {

class IosFlagsSaver {
  ios_base& ios_;
  ios_base::fmtflags flags_;

 public:
  IosFlagsSaver(ios_base& ios)
  : ios_(ios),
    flags_(ios.flags())
  {}

  ~IosFlagsSaver() {
    ios_.flags(flags_);
  }
};

struct BacktraceState {
  size_t skip;
  vector<InstructionPointer>& stackTrace;
};

_Unwind_Reason_Code unwindCallback(struct _Unwind_Context* context, void* arg) {
  BacktraceState* state = reinterpret_cast<BacktraceState*>(arg);
  auto absoluteProgramCounter =
      reinterpret_cast<InstructionPointer>(_Unwind_GetIP(context));

  if (state->skip > 0) {
    --state->skip;
    return _URC_NO_REASON;
  }

  if (state->stackTrace.size() == state->stackTrace.capacity()) {
    return _URC_END_OF_STACK;
  }

  state->stackTrace.push_back(absoluteProgramCounter);

  return _URC_NO_REASON;
}

void captureBacktrace(size_t skip, vector<InstructionPointer>& stackTrace) {
  // Beware of a bug on some platforms, which makes the trace loop until the
  // buffer is full when it reaches a noexcept function. It seems to be fixed in
  // newer versions of gcc. https://gcc.gnu.org/bugzilla/show_bug.cgi?id=56846
  // TODO(t10738439): Investigate workaround for the stack trace bug
  BacktraceState state = {skip, stackTrace};
  _Unwind_Backtrace(unwindCallback, &state);
}
}

void getStackTrace(vector<InstructionPointer>& stackTrace, size_t skip) {
  stackTrace.clear();
  captureBacktrace(skip + 1, stackTrace);
}

// TODO(t10737622): Improve on-device symbolification
void getStackTraceSymbols(vector<StackTraceElement>& symbols,
                          const vector<InstructionPointer>& trace) {
  symbols.clear();
  symbols.reserve(trace.size());

  for (size_t i = 0; i < trace.size(); ++i) {
    Dl_info info;
    if (dladdr(trace[i], &info)) {
      symbols.emplace_back(trace[i], info.dli_fbase, info.dli_saddr,
                           info.dli_fname ? info.dli_fname : "",
                           info.dli_sname ? info.dli_sname : "");
    }
  }
}

ostream& operator<<(ostream& out, const StackTraceElement& elm) {
  IosFlagsSaver flags{out};

  // TODO(t10748683): Add build id to the output
  out << "{dso=" << elm.libraryName() << " offset=" << hex
      << showbase << elm.libraryOffset();

  if (!elm.functionName().empty()) {
    out << " func=" << elm.functionName() << "()+" << elm.functionOffset();
  }

  out << " build-id=" << hex << setw(8) << 0
      << "}";

  return out;
}

// TODO(t10737667): The implement a tool that parse the stack trace and
// symbolicate it
ostream& operator<<(ostream& out, const vector<StackTraceElement>& trace) {
  IosFlagsSaver flags{out};

  auto i = 0;
  out << "Backtrace:\n";
  for (auto& elm : trace) {
    out << "    #" << dec << setfill('0') << setw(2) << i++ << " " << elm << '\n';
  }

  return out;
}
}
}
