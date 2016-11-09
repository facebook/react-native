#include "JSCLegacyProfiler.h"

#include "APICast.h"
#include "LegacyProfiler.h"
#include "OpaqueJSString.h"
#include "JSProfilerPrivate.h"
#include "JSStringRef.h"
#include "String.h"
#include "Options.h"

enum json_gen_status {
  json_gen_status_ok = 0,
  json_gen_status_error = 1,
};

enum json_entry {
  json_entry_key,
  json_entry_value,
};

namespace {

struct json_state {
  FILE *fileOut;
  bool hasFirst;
};

}

typedef json_state *json_gen;

static void json_escaped_cstring_printf(json_gen gen, const char *str) {
  const char *cursor = str;
  fputc('"', gen->fileOut);
  while (*cursor) {
    const char *escape = nullptr;
    switch (*cursor) {
      case '"':
        escape = "\\\"";
        break;
      case '\b':
        escape = "\\b";
        break;
      case '\f':
        escape = "\\f";
        break;
      case '\n':
        escape = "\\n";
        break;
      case '\r':
        escape = "\\r";
        break;
      case '\t':
        escape = "\\t";
        break;
      case '\\':
        escape = "\\\\";
        break;
      default:
        break;
    }
    if (escape != nullptr) {
      fwrite(escape, 1, strlen(escape), gen->fileOut);
    } else {
      fputc(*cursor, gen->fileOut);
    }
    cursor++;
  }
  fputc('"', gen->fileOut);
}

static json_gen_status json_gen_key_cstring(json_gen gen, const char *buffer) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (gen->hasFirst) {
    fprintf(gen->fileOut, ",");
  }
  gen->hasFirst = true;

  json_escaped_cstring_printf(gen, buffer);
  return json_gen_status_ok;
}

static json_gen_status json_gen_map_open(json_gen gen, json_entry entryType) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (entryType == json_entry_value) {
    fprintf(gen->fileOut, ":");
  } else if (entryType == json_entry_key) {
    if (gen->hasFirst) {
      fprintf(gen->fileOut, ",");
    }
  }
  fprintf(gen->fileOut, "{");
  gen->hasFirst = false;
  return json_gen_status_ok;
}

static json_gen_status json_gen_map_close(json_gen gen) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  fprintf(gen->fileOut, "}");
  gen->hasFirst = true;
  return json_gen_status_ok;
}

static json_gen_status json_gen_array_open(json_gen gen, json_entry entryType) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (entryType == json_entry_value) {
    fprintf(gen->fileOut, ":");
  } else if (entryType == json_entry_key) {
    if (gen->hasFirst) {
      fprintf(gen->fileOut, ",");
    }
  }
  fprintf(gen->fileOut, "[");
  gen->hasFirst = false;
  return json_gen_status_ok;
}

static json_gen_status json_gen_array_close(json_gen gen) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  fprintf(gen->fileOut, "]");
  gen->hasFirst = true;
  return json_gen_status_ok;
}

static json_gen_status json_gen_keyvalue_cstring(json_gen gen, const char *key, const char *value) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (gen->hasFirst) {
    fprintf(gen->fileOut, ",");
  }
  gen->hasFirst = true;

  fprintf(gen->fileOut, "\"%s\" : ", key);
  json_escaped_cstring_printf(gen, value);

  return json_gen_status_ok;
}


static json_gen_status json_gen_keyvalue_integer(json_gen gen, const char *key, int value) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (gen->hasFirst) {
    fprintf(gen->fileOut, ",");
  }
  gen->hasFirst = true;

  fprintf(gen->fileOut, "\"%s\": %d", key, value);
  return json_gen_status_ok;
}

static json_gen_status json_gen_keyvalue_double(json_gen gen, const char *key, double value) {
  if (gen->fileOut == nullptr) {
    return json_gen_status_error;
  }

  if (gen->hasFirst) {
    fprintf(gen->fileOut, ",");
  }
  gen->hasFirst = true;

  fprintf(gen->fileOut, "\"%s\": %.20g", key, value);
  return json_gen_status_ok;
}

static json_gen json_gen_alloc(const char *fileName) {
  json_gen gen = (json_gen)malloc(sizeof(json_state));
  memset(gen, 0, sizeof(json_state));
  gen->fileOut = fopen(fileName, "wb");
  return gen;
}

static void json_gen_free(json_gen gen) {
  if (gen->fileOut) {
    fclose(gen->fileOut);
  }
  free(gen);
}

#define GEN_AND_CHECK(expr) \
  do { \
    json_gen_status GEN_AND_CHECK_status = (expr); \
    if (GEN_AND_CHECK_status != json_gen_status_ok) { \
      return GEN_AND_CHECK_status; \
    } \
  } while (false)


static json_gen_status append_children_array_json(json_gen gen, const JSC::ProfileNode *node);
static json_gen_status append_node_json(json_gen gen, const JSC::ProfileNode *node);

static json_gen_status append_root_json(json_gen gen, const JSC::Profile *profile) {
  GEN_AND_CHECK(json_gen_map_open(gen, json_entry_key));
  GEN_AND_CHECK(json_gen_key_cstring(gen, "rootNodes"));
#if IOS8
  GEN_AND_CHECK(append_children_array_json(gen, profile->head()));
#else
  GEN_AND_CHECK(append_children_array_json(gen, profile->rootNode()));
#endif
  GEN_AND_CHECK(json_gen_map_close(gen));

  return json_gen_status_ok;
}

static json_gen_status append_children_array_json(json_gen gen, const JSC::ProfileNode *node) {
  GEN_AND_CHECK(json_gen_array_open(gen, json_entry_value));
  for (RefPtr<JSC::ProfileNode> child : node->children()) {
    GEN_AND_CHECK(append_node_json(gen, child.get()));
  }
  GEN_AND_CHECK(json_gen_array_close(gen));

  return json_gen_status_ok;
}

static json_gen_status append_node_json(json_gen gen, const JSC::ProfileNode *node) {
  GEN_AND_CHECK(json_gen_map_open(gen, json_entry_key));
  GEN_AND_CHECK(json_gen_keyvalue_integer(gen, "id", node->id()));

  if (!node->functionName().isEmpty()) {
    GEN_AND_CHECK(json_gen_keyvalue_cstring(gen, "functionName", node->functionName().utf8().data()));
  }

  if (!node->url().isEmpty()) {
    GEN_AND_CHECK(json_gen_keyvalue_cstring(gen, "url", node->url().utf8().data()));
    GEN_AND_CHECK(json_gen_keyvalue_integer(gen, "lineNumber", node->lineNumber()));
    GEN_AND_CHECK(json_gen_keyvalue_integer(gen, "columnNumber", node->columnNumber()));
  }

  GEN_AND_CHECK(json_gen_key_cstring(gen, "calls"));
  GEN_AND_CHECK(json_gen_array_open(gen, json_entry_value));
  for (const JSC::ProfileNode::Call &call : node->calls()) {
    GEN_AND_CHECK(json_gen_map_open(gen, json_entry_key));
    GEN_AND_CHECK(json_gen_keyvalue_double(gen, "startTime", call.startTime()));
#if IOS8
    GEN_AND_CHECK(json_gen_keyvalue_double(gen, "totalTime", call.totalTime()));
#else
    GEN_AND_CHECK(json_gen_keyvalue_double(gen, "totalTime", call.elapsedTime()));
#endif
    GEN_AND_CHECK(json_gen_map_close(gen));
  }
  GEN_AND_CHECK(json_gen_array_close(gen));

  if (!node->children().isEmpty()) {
    GEN_AND_CHECK(json_gen_key_cstring(gen, "children"));
    GEN_AND_CHECK(append_children_array_json(gen, node));
  }

  GEN_AND_CHECK(json_gen_map_close(gen));

  return json_gen_status_ok;
}

static void convert_to_json(const JSC::Profile *profile, const char *filename) {
  json_gen_status status;
  json_gen gen = json_gen_alloc(filename);

  status = append_root_json(gen, profile);
  if (status != json_gen_status_ok) {
    FILE *fileOut = fopen(filename, "wb");
    if (fileOut != nullptr) {
      fprintf(fileOut, "{\"error\": %d}", (int)status);
      fclose(fileOut);
    }
  }
  json_gen_free(gen);
}

// Based on JSEndProfiling, with a little extra code to return the profile as JSON.
static void JSEndProfilingAndRender(JSContextRef ctx, const char *title, const char *filename)
{
    JSC::ExecState *exec = toJS(ctx);
    JSC::LegacyProfiler *profiler = JSC::LegacyProfiler::profiler();
    RefPtr<JSC::Profile> rawProfile = profiler->stopProfiling(exec, WTF::String(title));
    convert_to_json(rawProfile.get(), filename);
}

extern "C" {

void nativeProfilerEnableBytecode(void)
{
    JSC::Options::setOption("forceProfilerBytecodeGeneration=true");
}

void nativeProfilerStart(JSContextRef ctx, const char *title) {
  JSStartProfiling(ctx, JSStringCreateWithUTF8CString(title));
}

void nativeProfilerEnd(JSContextRef ctx, const char *title, const char *filename) {
  JSEndProfilingAndRender(ctx, title, filename);
}

}
