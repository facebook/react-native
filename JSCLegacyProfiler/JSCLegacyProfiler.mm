//#include "config.h"

#include "JSCLegacyProfiler.h"

#include "APICast.h"
#include "LegacyProfiler.h"
#include "OpaqueJSString.h"
#include "JSProfilerPrivate.h"
#include "JSStringRef.h"

#include <yajl/yajl_gen.h>

#define GEN_AND_CHECK(expr) \
  do { \
    yajl_gen_status GEN_AND_CHECK_status = (expr); \
    if (GEN_AND_CHECK_status != yajl_gen_status_ok) { \
      return GEN_AND_CHECK_status; \
    } \
  } while (false)

static inline yajl_gen_status yajl_gen_cstring(yajl_gen gen, const char *str) {
  return yajl_gen_string(gen, (const unsigned char*)str, strlen(str));
}

static yajl_gen_status append_children_array_json(yajl_gen gen, const JSC::ProfileNode *node);
static yajl_gen_status append_node_json(yajl_gen gen, const JSC::ProfileNode *node);

static yajl_gen_status append_root_json(yajl_gen gen, const JSC::Profile *profile) {
  GEN_AND_CHECK(yajl_gen_map_open(gen));
  GEN_AND_CHECK(yajl_gen_cstring(gen, "rootNodes"));
  GEN_AND_CHECK(append_children_array_json(gen, profile->head()));
  GEN_AND_CHECK(yajl_gen_map_close(gen));

  return yajl_gen_status_ok;
}

static yajl_gen_status append_children_array_json(yajl_gen gen, const JSC::ProfileNode *node) {
  GEN_AND_CHECK(yajl_gen_array_open(gen));
  for (RefPtr<JSC::ProfileNode> child : node->children()) {
    GEN_AND_CHECK(append_node_json(gen, child.get()));
  }
  GEN_AND_CHECK(yajl_gen_array_close(gen));

  return yajl_gen_status_ok;
}

static yajl_gen_status append_node_json(yajl_gen gen, const JSC::ProfileNode *node) {
  GEN_AND_CHECK(yajl_gen_map_open(gen));
  GEN_AND_CHECK(yajl_gen_cstring(gen, "id"));
  GEN_AND_CHECK(yajl_gen_integer(gen, node->id()));

  if (!node->functionName().isEmpty()) {
    GEN_AND_CHECK(yajl_gen_cstring(gen, "functionName"));
    GEN_AND_CHECK(yajl_gen_cstring(gen, node->functionName().utf8().data()));
  }

  if (!node->url().isEmpty()) {
    GEN_AND_CHECK(yajl_gen_cstring(gen, "url"));
    GEN_AND_CHECK(yajl_gen_cstring(gen, node->url().utf8().data()));
    GEN_AND_CHECK(yajl_gen_cstring(gen, "lineNumber"));
    GEN_AND_CHECK(yajl_gen_integer(gen, node->lineNumber()));
    GEN_AND_CHECK(yajl_gen_cstring(gen, "columnNumber"));
    GEN_AND_CHECK(yajl_gen_integer(gen, node->columnNumber()));
  }

  GEN_AND_CHECK(yajl_gen_cstring(gen, "calls"));
  GEN_AND_CHECK(yajl_gen_array_open(gen));
  for (const JSC::ProfileNode::Call &call : node->calls()) {
    GEN_AND_CHECK(yajl_gen_map_open(gen));
    GEN_AND_CHECK(yajl_gen_cstring(gen, "startTime"));
    GEN_AND_CHECK(yajl_gen_double(gen, call.startTime()));
    GEN_AND_CHECK(yajl_gen_cstring(gen, "totalTime"));
    GEN_AND_CHECK(yajl_gen_double(gen, call.totalTime()));
    GEN_AND_CHECK(yajl_gen_map_close(gen));
  }
  GEN_AND_CHECK(yajl_gen_array_close(gen));

  if (!node->children().isEmpty()) {
    GEN_AND_CHECK(yajl_gen_cstring(gen, "children"));
    GEN_AND_CHECK(append_children_array_json(gen, node));
  }

  GEN_AND_CHECK(yajl_gen_map_close(gen));

  return yajl_gen_status_ok;
}

static char *render_error_code(yajl_gen_status status) {
  char err[1024];
  snprintf(err, sizeof(err), "{\"error\": %d}", (int)status);
  return strdup(err);
}

static char *convert_to_json(const JSC::Profile *profile) {
  yajl_gen_status status;
  yajl_gen gen = yajl_gen_alloc(NULL);

  status = append_root_json(gen, profile);
  if (status != yajl_gen_status_ok) {
    yajl_gen_free(gen);
    return render_error_code(status);
  }

  const unsigned char *buf;
  size_t buf_size;
  status = yajl_gen_get_buf(gen, &buf, &buf_size);
  if (status != yajl_gen_status_ok) {
    yajl_gen_free(gen);
    return render_error_code(status);
  }

  char *json_copy = strdup((const char*)buf);
  yajl_gen_free(gen);
  return json_copy;
}

static char *JSEndProfilingAndRender(JSContextRef ctx, JSStringRef title)
{
    JSC::ExecState *exec = toJS(ctx);
    JSC::LegacyProfiler *profiler = JSC::LegacyProfiler::profiler();
    RefPtr<JSC::Profile> rawProfile = profiler->stopProfiling(exec, title->string());
    return convert_to_json(rawProfile.get());
}

JSValueRef nativeProfilerStart(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount < 1) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], NULL);
  JSStartProfiling(ctx, title);
  JSStringRelease(title);
  return JSValueMakeUndefined(ctx);
}

JSValueRef nativeProfilerEnd(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount < 1) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  JSStringRef title = JSValueToStringCopy(ctx, arguments[0], NULL);
  char *rendered = JSEndProfilingAndRender(ctx, title);
  JSStringRelease(title);
  JSStringRef profile = JSStringCreateWithUTF8CString(rendered);
  free(rendered);
  return JSValueMakeString(ctx, profile);
}
