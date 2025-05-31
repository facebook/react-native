package com.facebook.react.uimanager;

import android.content.Context;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableNativeMap;
import com.tencent.mmkv.MMKV;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;

/**
 * Caches two separate JSON blobs in MMKV:
 *   • Full UIManager constants (under MMKV_KEY_CONSTANTS)
 *   • bubblingEventTypes map only (under MMKV_KEY_BUBBLING)
 *
 * On init(...), a background thread:
 *   1) calls MMKV.initialize(...)
 *   2) reads both keys, parses them into Maps
 *   3) builds a WritableNativeMap from the full constants map via Arguments.makeNativeMap(...)
 *   4) countDown()s loadLatch
 *
 * Exposed methods all block until that single background load finishes:
 *   • getCachedConstants() → Map<String,Object> or null
 *   • getCachedBubblingEventsTypes() → Map<String,Object> or null
 *   • getUIManagerConstantsAsWritableMap() → WritableNativeMap or null
 *
 * To persist:
 *   • call saveConstantsAndBubblingEventsTypes(freshConstantsMap, freshBubblingEventsMap)
 *     which writes two JSON strings (one under each key) off the main thread,
 *     and updates in‐memory maps immediately.
 */
public class UIManagerConstantsCache {
    private static final String TAG = "UIManagerConstantsCache";

    // MMKV keys for two separate blobs
    private static final String MMKV_KEY_CONSTANTS = "UIManagerModuleConstants_v1";
    private static final String MMKV_KEY_BUBBLING  = "UIManagerModuleBubbling_v1";

    private static final UIManagerConstantsCache INSTANCE = new UIManagerConstantsCache();

    /** In-memory store of the parsed Map<String,Object> (full constants). */
    private Map<String,Object> cachedConstants = null;

    /** In-memory store of the parsed Map<String,Object> (bubblingEventTypes only). */
    private Map<String,Object> cachedBubblingEventsTypes = null;

    /** In-memory store of the pre-built WritableNativeMap for full constants. */
    private WritableNativeMap cachedNativeMap = null;

    /** Latch that background-loads both JSON blobs exactly once. */
    private final CountDownLatch loadLatch = new CountDownLatch(1);

    /** Ensures init(...) is only done once. */
    private volatile boolean initCalled = false;

    private UIManagerConstantsCache() {
        // private constructor
    }

    public static UIManagerConstantsCache getInstance() {
        return INSTANCE;
    }

    /**
     * Must be called (once) from Application or MainActivity before any UIManager
     * constants are accessed. This kicks off:
     *   1) MMKV.initialize(...)
     *   2) A background thread that reads two MMKV keys, parses them → Maps,
     *      then builds a WritableNativeMap from the full constants, and finally
     *      countDown()s loadLatch.
     */
    public synchronized void init(Context appContext) {
        if (initCalled) {
            return;
        }
        initCalled = true;

        // 1) Initialize MMKV
        MMKV.initialize(appContext.getApplicationContext());

        // 2) Background thread to load both blobs
        new Thread(() -> {
            try {
                MMKV mmkv = MMKV.defaultMMKV();

                // 2a) Read full-constants JSON
                String jsonConstants = mmkv.decodeString(MMKV_KEY_CONSTANTS, null);
                if (jsonConstants != null) {
                    try {
                        JSONObject rootConsts = new JSONObject(jsonConstants);
                        Map<String,Object> mapConsts = jsonToMap(rootConsts);
                        synchronized (this) {
                            cachedConstants = mapConsts;
                        }
                        Log.v(TAG, "Background-loaded full UIManager constants (size="
                                + (mapConsts == null ? 0 : mapConsts.size()) + ")");
                    } catch (JSONException je) {
                        Log.w(TAG, "Invalid JSON in MMKV (constants). Will regenerate.\n"
                                + jsonConstants, je);
                        synchronized (this) {
                            cachedConstants = null;
                        }
                    }
                } else {
                    synchronized (this) {
                        cachedConstants = null;
                    }
                    Log.v(TAG, "No UIManager constants found in MMKV.");
                }

                // 2b) Read bubblingEventTypes JSON
                String jsonBubbling = mmkv.decodeString(MMKV_KEY_BUBBLING, null);
                if (jsonBubbling != null) {
                    try {
                        JSONObject rootBub = new JSONObject(jsonBubbling);
                        Map<String,Object> mapBub = jsonToMap(rootBub);
                        synchronized (this) {
                            cachedBubblingEventsTypes = mapBub;
                        }
                        Log.v(TAG, "Background-loaded bubblingEventTypes (size="
                                + (mapBub == null ? 0 : mapBub.size()) + ")");
                    } catch (JSONException je) {
                        Log.w(TAG, "Invalid JSON in MMKV (bubblingEventTypes). Will regenerate.\n"
                                + jsonBubbling, je);
                        synchronized (this) {
                            cachedBubblingEventsTypes = null;
                        }
                    }
                } else {
                    synchronized (this) {
                        cachedBubblingEventsTypes = null;
                    }
                    Log.v(TAG, "No bubblingEventTypes found in MMKV.");
                }

                // 2c) Build WritableNativeMap from full constants (if available)
                synchronized (this) {
                    if (cachedConstants != null) {
                        cachedNativeMap = Arguments.makeNativeMap(cachedConstants);
                    } else {
                        cachedNativeMap = null;
                    }
                }
            } finally {
                // Signal load completion
                loadLatch.countDown();
            }
        }, "UIManagerConstantsCache-Loader").start();
    }

    /**
     * Blocks until background-load finishes, then returns the full constants map.
     * @return parsed Map<String,Object> or null if none stored / parse failed.
     */
    public Map<String,Object> getCachedConstants() {
        try {
            loadLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.w(TAG, "getCachedConstants() interrupted while waiting.");
            return null;
        }
        synchronized (this) {
            return cachedConstants;
        }
    }

    /**
     * Blocks until background-load finishes, then returns the bubblingEventTypes map.
     * @return parsed Map<String,Object> or null if none stored / parse failed.
     */
    public Map<String,Object> getCachedBubblingEventsTypes() {
        try {
            loadLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.w(TAG, "getCachedBubblingEventsTypes() interrupted while waiting.");
            return null;
        }
        synchronized (this) {
            return cachedBubblingEventsTypes;
        }
    }

    /**
     * Blocks until background-load (and WritableNativeMap build) finishes.
     * @return pre-built WritableNativeMap or null if no full-constants available.
     */
    public WritableNativeMap getUIManagerConstantsAsWritableMap() {
        try {
            loadLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.w(TAG, "getUIManagerConstantsAsWritableMap() interrupted while waiting.");
            return null;
        }
        synchronized (this) {
            return cachedNativeMap;
        }
    }

    /**
     * Takes freshly-built maps (full constants & bubblingEventTypes) and:
     *   1) Spawns a background thread to JSON-serialize + write each to its own MMKV key,
     *   2) Updates in-memory caches (constants, bubbling types, and native map) so getters return immediately.
     */
    public void saveConstantsAndBubblingEventsTypes(
            final Map<String,Object> constants,
            final Map<String,Object> bubblingEventsTypes) {
        if (constants == null) {
            return;
        }

        // Spawn a background thread to write both JSON blobs
        new Thread(() -> {
            try {
                // Serialize full constants
                JSONObject jsonConsts = mapToJson(constants);
                long t0 = System.currentTimeMillis();
                MMKV.defaultMMKV().encode(MMKV_KEY_CONSTANTS, jsonConsts.toString());
                long t1 = System.currentTimeMillis();
                Log.v(TAG, "Saved UIManager constants to MMKV in " + (t1 - t0) + "ms");
            } catch (JSONException e) {
                Log.e(TAG, "Failed to JSON-serialize UIManager constants; not caching.", e);
            }

            if (bubblingEventsTypes != null) {
                try {
                    // Serialize bubblingEventTypes
                    JSONObject jsonBub = mapToJson(bubblingEventsTypes);
                    long t2 = System.currentTimeMillis();
                    MMKV.defaultMMKV().encode(MMKV_KEY_BUBBLING, jsonBub.toString());
                    long t3 = System.currentTimeMillis();
                    Log.v(TAG, "Saved bubblingEventTypes to MMKV in " + (t3 - t2) + "ms");
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to JSON-serialize bubblingEventTypes; not caching.", e);
                }
            }
        }, "UIManagerConstantsCache-Saver").start();
    }

    // ────────────────────────────────────────────────────────────────────────────────
    //   JSON ↔ Map<String,Object> Helpers (identical to before)
    // ────────────────────────────────────────────────────────────────────────────────

    private static JSONObject mapToJson(Map<String,Object> map) throws JSONException {
        JSONObject json = new JSONObject();
        for (Map.Entry<String,Object> entry : map.entrySet()) {
            String key = entry.getKey();
            Object val = entry.getValue();
            if (val == null) {
                json.put(key, JSONObject.NULL);
            } else if (val instanceof String) {
                json.put(key, (String) val);
            } else if (val instanceof Boolean) {
                json.put(key, (Boolean) val);
            } else if (val instanceof Number) {
                json.put(key, (Number) val);
            } else if (val instanceof Map) {
                //noinspection unchecked
                json.put(key, mapToJson((Map<String,Object>) val));
            } else if (val instanceof List) {
                //noinspection unchecked
                json.put(key, listToJsonArray((List<Object>) val));
            } else {
                throw new JSONException(
                        "Unsupported value type for key \"" + key + "\": " + val.getClass()
                );
            }
        }
        return json;
    }

    private static JSONArray listToJsonArray(List<Object> list) throws JSONException {
        JSONArray arr = new JSONArray();
        for (Object elem : list) {
            if (elem == null) {
                arr.put(JSONObject.NULL);
            } else if (elem instanceof String) {
                arr.put((String) elem);
            } else if (elem instanceof Boolean) {
                arr.put((Boolean) elem);
            } else if (elem instanceof Number) {
                arr.put((Number) elem);
            } else if (elem instanceof Map) {
                //noinspection unchecked
                arr.put(mapToJson((Map<String,Object>) elem));
            } else if (elem instanceof List) {
                //noinspection unchecked
                arr.put(listToJsonArray((List<Object>) elem));
            } else {
                throw new JSONException("Unsupported list element type: " + elem.getClass());
            }
        }
        return arr;
    }

    private static Map<String,Object> jsonToMap(JSONObject json) throws JSONException {
        Map<String,Object> result = new HashMap<>();
        Iterator<String> keys = json.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object raw = json.get(key);
            if (raw == JSONObject.NULL) {
                result.put(key, null);
            } else if (raw instanceof Boolean || raw instanceof Number || raw instanceof String) {
                result.put(key, raw);
            } else if (raw instanceof JSONObject) {
                result.put(key, jsonToMap((JSONObject) raw));
            } else if (raw instanceof JSONArray) {
                result.put(key, jsonArrayToList((JSONArray) raw));
            } else {
                throw new JSONException(
                        "Unsupported JSON type in UIManager constants for key \"" + key + "\": "
                                + raw.getClass()
                );
            }
        }
        return result;
    }

    private static List<Object> jsonArrayToList(JSONArray arr) throws JSONException {
        List<Object> result = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            Object raw = arr.get(i);
            if (raw == JSONObject.NULL) {
                result.add(null);
            } else if (raw instanceof Boolean || raw instanceof Number || raw instanceof String) {
                result.add(raw);
            } else if (raw instanceof JSONObject) {
                result.add(jsonToMap((JSONObject) raw));
            } else if (raw instanceof JSONArray) {
                result.add(jsonArrayToList((JSONArray) raw));
            } else {
                throw new JSONException(
                        "Unsupported JSON array element at index " + i + ": " + raw.getClass()
                );
            }
        }
        return result;
    }
}
