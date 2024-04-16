package com.concurrent_ruby.ext;

import org.jruby.*;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import com.concurrent_ruby.ext.jsr166e.ConcurrentHashMap;
import com.concurrent_ruby.ext.jsr166e.ConcurrentHashMapV8;
import com.concurrent_ruby.ext.jsr166e.nounsafe.*;
import org.jruby.runtime.Block;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.runtime.load.Library;

import java.io.IOException;
import java.util.Map;

import static org.jruby.runtime.Visibility.PRIVATE;

/**
 * Native Java implementation to avoid the JI overhead.
 *
 * @author thedarkone
 */
public class JRubyMapBackendLibrary implements Library {
  public void load(Ruby runtime, boolean wrap) throws IOException {

    RubyModule concurrentMod = runtime.defineModule("Concurrent");
    RubyModule thread_safeMod = concurrentMod.defineModuleUnder("Collection");
    RubyClass jrubyRefClass = thread_safeMod.defineClassUnder("JRubyMapBackend", runtime.getObject(), BACKEND_ALLOCATOR);
    jrubyRefClass.setAllocator(BACKEND_ALLOCATOR);
    jrubyRefClass.defineAnnotatedMethods(JRubyMapBackend.class);
  }

  private static final ObjectAllocator BACKEND_ALLOCATOR = new ObjectAllocator() {
    public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
      return new JRubyMapBackend(runtime, klazz);
    }
  };

  @JRubyClass(name="JRubyMapBackend", parent="Object")
    public static class JRubyMapBackend extends RubyObject {
      // Defaults used by the CHM
      static final int DEFAULT_INITIAL_CAPACITY = 16;
      static final float DEFAULT_LOAD_FACTOR = 0.75f;

      public static final boolean CAN_USE_UNSAFE_CHM = canUseUnsafeCHM();

      private ConcurrentHashMap<IRubyObject, IRubyObject> map;

      private static ConcurrentHashMap<IRubyObject, IRubyObject> newCHM(int initialCapacity, float loadFactor) {
        if (CAN_USE_UNSAFE_CHM) {
          return new ConcurrentHashMapV8<IRubyObject, IRubyObject>(initialCapacity, loadFactor);
        } else {
          return new com.concurrent_ruby.ext.jsr166e.nounsafe.ConcurrentHashMapV8<IRubyObject, IRubyObject>(initialCapacity, loadFactor);
        }
      }

      private static ConcurrentHashMap<IRubyObject, IRubyObject> newCHM() {
        return newCHM(DEFAULT_INITIAL_CAPACITY, DEFAULT_LOAD_FACTOR);
      }

      private static boolean canUseUnsafeCHM() {
        try {
          new com.concurrent_ruby.ext.jsr166e.ConcurrentHashMapV8(); // force class load and initialization
          return true;
        } catch (Throwable t) { // ensuring we really do catch everything
          // Doug's Unsafe setup errors always have this "Could not ini.." message
          if (isCausedBySecurityException(t)) {
            return false;
          }
          throw (t instanceof RuntimeException ? (RuntimeException) t : new RuntimeException(t));
        }
      }

      private static boolean isCausedBySecurityException(Throwable t) {
        while (t != null) {
          if ((t.getMessage() != null && t.getMessage().contains("Could not initialize intrinsics")) || t instanceof SecurityException) {
            return true;
          }
          t = t.getCause();
        }
        return false;
      }

      public JRubyMapBackend(Ruby runtime, RubyClass klass) {
        super(runtime, klass);
      }

      @JRubyMethod
      public IRubyObject initialize(ThreadContext context) {
        map = newCHM();
        return context.getRuntime().getNil();
      }

      @JRubyMethod
      public IRubyObject initialize(ThreadContext context, IRubyObject options) {
        map = toCHM(context, options);
        return context.getRuntime().getNil();
      }

      private ConcurrentHashMap<IRubyObject, IRubyObject> toCHM(ThreadContext context, IRubyObject options) {
        Ruby runtime = context.getRuntime();
        if (!options.isNil() && options.respondsTo("[]")) {
          IRubyObject rInitialCapacity = options.callMethod(context, "[]", runtime.newSymbol("initial_capacity"));
          IRubyObject rLoadFactor      = options.callMethod(context, "[]", runtime.newSymbol("load_factor"));
          int initialCapacity = !rInitialCapacity.isNil() ? RubyNumeric.num2int(rInitialCapacity.convertToInteger()) : DEFAULT_INITIAL_CAPACITY;
          float loadFactor    = !rLoadFactor.isNil() ?      (float)RubyNumeric.num2dbl(rLoadFactor.convertToFloat()) : DEFAULT_LOAD_FACTOR;
          return newCHM(initialCapacity, loadFactor);
        } else {
          return newCHM();
        }
      }

      @JRubyMethod(name = "[]", required = 1)
        public IRubyObject op_aref(ThreadContext context, IRubyObject key) {
          IRubyObject value;
          return ((value = map.get(key)) == null) ? context.getRuntime().getNil() : value;
        }

      @JRubyMethod(name = {"[]="}, required = 2)
        public IRubyObject op_aset(IRubyObject key, IRubyObject value) {
          map.put(key, value);
          return value;
        }

      @JRubyMethod
      public IRubyObject put_if_absent(IRubyObject key, IRubyObject value) {
        IRubyObject result = map.putIfAbsent(key, value);
        return result == null ? getRuntime().getNil() : result;
      }

      @JRubyMethod
      public IRubyObject compute_if_absent(final ThreadContext context, final IRubyObject key, final Block block) {
        return map.computeIfAbsent(key, new ConcurrentHashMap.Fun<IRubyObject, IRubyObject>() {
          @Override
          public IRubyObject apply(IRubyObject key) {
            return block.yieldSpecific(context);
          }
        });
      }

      @JRubyMethod
      public IRubyObject compute_if_present(final ThreadContext context, final IRubyObject key, final Block block) {
        IRubyObject result = map.computeIfPresent(key, new ConcurrentHashMap.BiFun<IRubyObject, IRubyObject, IRubyObject>() {
          @Override
          public IRubyObject apply(IRubyObject key, IRubyObject oldValue) {
            IRubyObject result = block.yieldSpecific(context, oldValue == null ? context.getRuntime().getNil() : oldValue);
            return result.isNil() ? null : result;
          }
        });
        return result == null ? context.getRuntime().getNil() : result;
      }

      @JRubyMethod
      public IRubyObject compute(final ThreadContext context, final IRubyObject key, final Block block) {
        IRubyObject result = map.compute(key, new ConcurrentHashMap.BiFun<IRubyObject, IRubyObject, IRubyObject>() {
          @Override
          public IRubyObject apply(IRubyObject key, IRubyObject oldValue) {
            IRubyObject result = block.yieldSpecific(context, oldValue == null ? context.getRuntime().getNil() : oldValue);
            return result.isNil() ? null : result;
          }
        });
        return result == null ? context.getRuntime().getNil() : result;
      }

      @JRubyMethod
      public IRubyObject merge_pair(final ThreadContext context, final IRubyObject key, final IRubyObject value, final Block block) {
        IRubyObject result = map.merge(key, value, new ConcurrentHashMap.BiFun<IRubyObject, IRubyObject, IRubyObject>() {
          @Override
          public IRubyObject apply(IRubyObject oldValue, IRubyObject newValue) {
            IRubyObject result = block.yieldSpecific(context, oldValue == null ? context.getRuntime().getNil() : oldValue);
            return result.isNil() ? null : result;
          }
        });
        return result == null ? context.getRuntime().getNil() : result;
      }

      @JRubyMethod
      public RubyBoolean replace_pair(IRubyObject key, IRubyObject oldValue, IRubyObject newValue) {
        return getRuntime().newBoolean(map.replace(key, oldValue, newValue));
      }

      @JRubyMethod(name = "key?", required = 1)
        public RubyBoolean has_key_p(IRubyObject key) {
          return map.containsKey(key) ? getRuntime().getTrue() : getRuntime().getFalse();
        }

      @JRubyMethod
      public IRubyObject key(IRubyObject value) {
        final IRubyObject key = map.findKey(value);
        return key == null ? getRuntime().getNil() : key;
      }

      @JRubyMethod
      public IRubyObject replace_if_exists(IRubyObject key, IRubyObject value) {
        IRubyObject result = map.replace(key, value);
        return result == null ? getRuntime().getNil() : result;
      }

      @JRubyMethod
      public IRubyObject get_and_set(IRubyObject key, IRubyObject value) {
        IRubyObject result = map.put(key, value);
        return result == null ? getRuntime().getNil() : result;
      }

      @JRubyMethod
      public IRubyObject delete(IRubyObject key) {
        IRubyObject result = map.remove(key);
        return result == null ? getRuntime().getNil() : result;
      }

      @JRubyMethod
      public RubyBoolean delete_pair(IRubyObject key, IRubyObject value) {
        return getRuntime().newBoolean(map.remove(key, value));
      }

      @JRubyMethod
      public IRubyObject clear() {
        map.clear();
        return this;
      }

      @JRubyMethod
      public IRubyObject each_pair(ThreadContext context, Block block) {
        for (Map.Entry<IRubyObject,IRubyObject> entry : map.entrySet()) {
          block.yieldSpecific(context, entry.getKey(), entry.getValue());
        }
        return this;
      }

      @JRubyMethod
      public RubyFixnum size(ThreadContext context) {
        return context.getRuntime().newFixnum(map.size());
      }

      @JRubyMethod
      public IRubyObject get_or_default(IRubyObject key, IRubyObject defaultValue) {
        return map.getValueOrDefault(key, defaultValue);
      }

      @JRubyMethod(visibility = PRIVATE)
        public JRubyMapBackend initialize_copy(ThreadContext context, IRubyObject other) {
          map = newCHM();
          return this;
        }
    }
}
