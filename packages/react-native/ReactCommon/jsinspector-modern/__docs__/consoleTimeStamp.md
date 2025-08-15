# console.timeStamp API

[🏠 Home](../../../../../README.md)

The console.timeStamp API provides a way to record markers on the timeline of
the Performance instrumentation.

The idea is to have a highly performant API for instrumenting React Native
applications and surfacing the recorded timing data to performance tooling:
Performance panel or Perfetto. This API should be explicitly designed to have
minimal runtime overhead and expected to be used for instrumenting hot paths and
profiling (production) builds.

See also:

- https://developer.mozilla.org/en-US/docs/Web/API/console/timeStamp_static
- https://developer.chrome.com/docs/devtools/performance/extension#inject_your_data_with_consoletimestamp

## 🚀 Usage

The `console.timeStamp()` method can be called with various parameters to record
markers on the performance timeline:

```javascript
// Basic usage with just a label
console.timeStamp('Click');

// Advanced usage with start and end markers
console.timeStamp('Animation', performance.now(), performance.now() + 500);

// Full usage with all parameters
console.timeStamp(
  'Animation', // label
  performance.now(), // start time
  performance.now() + 500, // end time
  'UI Animations', // track name
  'Main Thread', // track group
  'primary', // color
);
```

More examples are available on
[Chrome DevTools website](https://developer.chrome.com/docs/devtools/performance/extension#consoletimestamp_api_examples).

### ⚙️ Parameters

1. `label` (required): A string label for the timestamp marker
2. `start` (optional): A
   [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp)
   or string marker for the start time
3. `end` (optional): A
   [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp)
   or string marker for the end time
4. `trackName` (optional): A string specifying the track name
5. `trackGroup` (optional): A string specifying the track group
6. `color` (optional): A string specifying the color of the timestamp marker.
   Supported values depend on Performance instrumentation, for React Native
   DevTools, the supported values are listed in ConsoleTimeStamp.h.

## 📐 Design

The console.timeStamp API is a JSI Host Function that is installed as part of
the Console interface when JavaScript Runtime target is registered with the
jsinspector-modern stack.

To achieve minimal runtime costs:

- This API will not add or buffer Performance Entries that can be accessed or
  observed with PerformanceObserver.
- This API won’t have any buffering implemented by design. The buffering may be
  implemented by the performance tooling, if needed.
- This API will have limited validation and user feedback. All incorrect timing
  entries are expected to be ignored.

## 🩻 Visualization

With Chrome DevTools Performance panel integration:

- Marks (only `label` specified) are not reported to custom tracks. They are
  only reported as `"TimeStamp: <label>"` entries on the Timings track.
- Measures (both start and end are defined) are reported to custom tracks, if
  specified.

## 🔗 Relationship with other systems

### Part of

- jsinspector-modern: The JavaScript debugger stack for React Native DevTools,
  which controls the lifetime of the Console interface for the targeted
  JavaScript Runtime.

### Used by this

- Performance Tracing System: The console.timeStamp API reports markers to the
  PerformanceTracer singleton, which is a Trace Event engine responsible for
  collection, storage and serialization of Performance timeline events.
