package com.concurrent_ruby.ext;

import java.lang.reflect.Field;
import java.io.IOException;
import java.util.concurrent.atomic.AtomicReferenceFieldUpdater;
import org.jruby.Ruby;
import org.jruby.RubyClass;
import org.jruby.RubyModule;
import org.jruby.RubyNumeric;
import org.jruby.RubyObject;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.runtime.load.Library;

/**
 * This library adds an atomic reference type to JRuby for use in the atomic
 * library. We do a native version to avoid the implicit value coercion that
 * normally happens through JI.
 * 
 * @author headius
 */
public class AtomicReferenceLibrary implements Library {
    public void load(Ruby runtime, boolean wrap) throws IOException {
        RubyModule concurrentMod = runtime.defineModule("Concurrent");
        RubyClass atomicCls = concurrentMod.defineClassUnder("JavaAtomicReference", runtime.getObject(), JRUBYREFERENCE_ALLOCATOR);
        try {
            sun.misc.Unsafe.class.getMethod("getAndSetObject", Object.class);
            atomicCls.setAllocator(JRUBYREFERENCE8_ALLOCATOR);
        } catch (Exception e) {
            // leave it as Java 6/7 version
        }
        atomicCls.defineAnnotatedMethods(JRubyReference.class);
    }
    
    private static final ObjectAllocator JRUBYREFERENCE_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JRubyReference(runtime, klazz);
        }
    };
    
    private static final ObjectAllocator JRUBYREFERENCE8_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JRubyReference8(runtime, klazz);
        }
    };

    @JRubyClass(name="JRubyReference", parent="Object")
    public static class JRubyReference extends RubyObject {
        volatile IRubyObject reference;
        
        static final sun.misc.Unsafe UNSAFE;
        static final long referenceOffset;

        static {
            try {
                UNSAFE = UnsafeHolder.U;
                Class k = JRubyReference.class;
                referenceOffset = UNSAFE.objectFieldOffset(k.getDeclaredField("reference"));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        public JRubyReference(Ruby runtime, RubyClass klass) {
            super(runtime, klass);
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context) {
            UNSAFE.putObject(this, referenceOffset, context.nil);
            return context.nil;
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context, IRubyObject value) {
            UNSAFE.putObject(this, referenceOffset, value);
            return context.nil;
        }

        @JRubyMethod(name = {"get", "value"})
        public IRubyObject get() {
            return reference;
        }

        @JRubyMethod(name = {"set", "value="})
        public IRubyObject set(IRubyObject newValue) {
            UNSAFE.putObjectVolatile(this, referenceOffset, newValue);
            return newValue;
        }

        @JRubyMethod(name = {"compare_and_set", "compare_and_swap"})
        public IRubyObject compare_and_set(ThreadContext context, IRubyObject expectedValue, IRubyObject newValue) {
            Ruby runtime = context.runtime;
            
            if (expectedValue instanceof RubyNumeric) {
                // numerics are not always idempotent in Ruby, so we need to do slower logic
                return compareAndSetNumeric(context, expectedValue, newValue);
            }
            
            return runtime.newBoolean(UNSAFE.compareAndSwapObject(this, referenceOffset, expectedValue, newValue));
        }

        @JRubyMethod(name = {"get_and_set", "swap"})
        public IRubyObject get_and_set(ThreadContext context, IRubyObject newValue) {
            // less-efficient version for Java 6 and 7
            while (true) {
                IRubyObject oldValue = get();
                if (UNSAFE.compareAndSwapObject(this, referenceOffset, oldValue, newValue)) {
                    return oldValue;
                }
            }
        }
        
        private IRubyObject compareAndSetNumeric(ThreadContext context, IRubyObject expectedValue, IRubyObject newValue) {
            Ruby runtime = context.runtime;
            
            // loop until:
            // * reference CAS would succeed for same-valued objects
            // * current and expected have different values as determined by #equals
            while (true) {
                IRubyObject current = reference;

                if (!(current instanceof RubyNumeric)) {
                    // old value is not numeric, CAS fails
                    return runtime.getFalse();
                }

                RubyNumeric currentNumber = (RubyNumeric)current;
                if (!currentNumber.equals(expectedValue)) {
                    // current number does not equal expected, fail CAS
                    return runtime.getFalse();
                }

                // check that current has not changed, or else allow loop to repeat
                boolean success = UNSAFE.compareAndSwapObject(this, referenceOffset, current, newValue);
                if (success) {
                    // value is same and did not change in interim...success
                    return runtime.getTrue();
                }
            }
        }
    }

    private static final class UnsafeHolder {
	private UnsafeHolder(){}
	    
	public static final sun.misc.Unsafe U = loadUnsafe();
	
	private static sun.misc.Unsafe loadUnsafe() {
	    try {
		Class unsafeClass = Class.forName("sun.misc.Unsafe");
		Field f = unsafeClass.getDeclaredField("theUnsafe");
		f.setAccessible(true);
		return (sun.misc.Unsafe) f.get(null);
	    } catch (Exception e) {
		return null;
	    }
	}
    }
    
    public static class JRubyReference8 extends JRubyReference {
        public JRubyReference8(Ruby runtime, RubyClass klass) {
            super(runtime, klass);
        }

        @Override
        public IRubyObject get_and_set(ThreadContext context, IRubyObject newValue) {
            // efficient version for Java 8
            return (IRubyObject)UNSAFE.getAndSetObject(this, referenceOffset, newValue);
        }
    }
}
