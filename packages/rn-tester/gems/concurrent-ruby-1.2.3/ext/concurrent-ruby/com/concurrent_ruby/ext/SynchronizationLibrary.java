package com.concurrent_ruby.ext;

import org.jruby.Ruby;
import org.jruby.RubyBasicObject;
import org.jruby.RubyClass;
import org.jruby.RubyModule;
import org.jruby.RubyObject;
import org.jruby.RubyThread;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import org.jruby.runtime.Block;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.Visibility;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.runtime.load.Library;
import sun.misc.Unsafe;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

public class SynchronizationLibrary implements Library {

    private static final Unsafe UNSAFE = loadUnsafe();
    private static final boolean FULL_FENCE = supportsFences();

    private static Unsafe loadUnsafe() {
        try {
            Class ncdfe = Class.forName("sun.misc.Unsafe");
            Field f = ncdfe.getDeclaredField("theUnsafe");
            f.setAccessible(true);
            return (Unsafe) f.get((java.lang.Object) null);
        } catch (Exception var2) {
            return null;
        } catch (NoClassDefFoundError var3) {
            return null;
        }
    }

    private static boolean supportsFences() {
        if (UNSAFE == null) {
            return false;
        } else {
            try {
                Method m = UNSAFE.getClass().getDeclaredMethod("fullFence", new Class[0]);
                if (m != null) {
                    return true;
                }
            } catch (Exception var1) {
                // nothing
            }

            return false;
        }
    }

    private static final ObjectAllocator OBJECT_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new Object(runtime, klazz);
        }
    };

    private static final ObjectAllocator ABSTRACT_LOCKABLE_OBJECT_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new AbstractLockableObject(runtime, klazz);
        }
    };

    private static final ObjectAllocator JRUBY_LOCKABLE_OBJECT_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JRubyLockableObject(runtime, klazz);
        }
    };

    public void load(Ruby runtime, boolean wrap) throws IOException {
        RubyModule synchronizationModule = runtime.
                defineModule("Concurrent").
                defineModuleUnder("Synchronization");

        RubyModule jrubyAttrVolatileModule = synchronizationModule.defineModuleUnder("JRubyAttrVolatile");
        jrubyAttrVolatileModule.defineAnnotatedMethods(JRubyAttrVolatile.class);

        defineClass(runtime, synchronizationModule, "AbstractObject", "Object",
                Object.class, OBJECT_ALLOCATOR);

        defineClass(runtime, synchronizationModule, "Object", "AbstractLockableObject",
                AbstractLockableObject.class, ABSTRACT_LOCKABLE_OBJECT_ALLOCATOR);

        defineClass(runtime, synchronizationModule, "AbstractLockableObject", "JRubyLockableObject",
                JRubyLockableObject.class, JRUBY_LOCKABLE_OBJECT_ALLOCATOR);

        defineClass(runtime, synchronizationModule, "Object", "JRuby",
                JRuby.class, new ObjectAllocator() {
                    @Override
                    public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
                        return new JRuby(runtime, klazz);
                    }
                });
    }

    private RubyClass defineClass(
            Ruby runtime,
            RubyModule namespace,
            String parentName,
            String name,
            Class javaImplementation,
            ObjectAllocator allocator) {
        final RubyClass parentClass = namespace.getClass(parentName);

        if (parentClass == null) {
            System.out.println("not found " + parentName);
            throw runtime.newRuntimeError(namespace.toString() + "::" + parentName + " is missing");
        }

        final RubyClass newClass = namespace.defineClassUnder(name, parentClass, allocator);
        newClass.defineAnnotatedMethods(javaImplementation);
        return newClass;
    }

    // Facts:
    // - all ivar reads are without any synchronisation of fences see
    //   https://github.com/jruby/jruby/blob/master/core/src/main/java/org/jruby/runtime/ivars/VariableAccessor.java#L110-110
    // - writes depend on UnsafeHolder.U, null -> SynchronizedVariableAccessor, !null -> StampedVariableAccessor
    //   SynchronizedVariableAccessor wraps with synchronized block, StampedVariableAccessor uses fullFence or
    //   volatilePut
    // TODO (pitr 16-Sep-2015): what do we do in Java 9 ?

    // module JRubyAttrVolatile
    public static class JRubyAttrVolatile {

        // volatile threadContext is used as a memory barrier per the JVM memory model happens-before semantic
        // on volatile fields. any volatile field could have been used but using the thread context is an
        // attempt to avoid code elimination.
        private static volatile int volatileField;

        @JRubyMethod(name = "full_memory_barrier", visibility = Visibility.PUBLIC, module = true)
        public static IRubyObject fullMemoryBarrier(ThreadContext context, IRubyObject module) {
            // Prevent reordering of ivar writes with publication of this instance
            if (!FULL_FENCE) {
                // Assuming that following volatile read and write is not eliminated it simulates fullFence.
                // If it's eliminated it'll cause problems only on non-x86 platforms.
                // http://shipilev.net/blog/2014/jmm-pragmatics/#_happens_before_test_your_understanding
                final int volatileRead = volatileField;
                volatileField = context.getLine();
            } else {
                UNSAFE.fullFence();
            }
            return context.nil;
        }

        @JRubyMethod(name = "instance_variable_get_volatile", visibility = Visibility.PUBLIC, module = true)
        public static IRubyObject instanceVariableGetVolatile(
                ThreadContext context,
                IRubyObject module,
                IRubyObject self,
                IRubyObject name) {
            // Ensure we ses latest value with loadFence
            if (!FULL_FENCE) {
                // piggybacking on volatile read, simulating loadFence
                final int volatileRead = volatileField;
                return ((RubyBasicObject) self).instance_variable_get(context, name);
            } else {
                UNSAFE.loadFence();
                return ((RubyBasicObject) self).instance_variable_get(context, name);
            }
        }

        @JRubyMethod(name = "instance_variable_set_volatile", visibility = Visibility.PUBLIC, module = true)
        public static IRubyObject InstanceVariableSetVolatile(
                ThreadContext context,
                IRubyObject module,
                IRubyObject self,
                IRubyObject name,
                IRubyObject value) {
            // Ensure we make last update visible
            if (!FULL_FENCE) {
                // piggybacking on volatile write, simulating storeFence
                final IRubyObject result = ((RubyBasicObject) self).instance_variable_set(name, value);
                volatileField = context.getLine();
                return result;
            } else {
                // JRuby uses StampedVariableAccessor which calls fullFence
                // so no additional steps needed.
                // See https://github.com/jruby/jruby/blob/master/core/src/main/java/org/jruby/runtime/ivars/StampedVariableAccessor.java#L151-L159
                return ((RubyBasicObject) self).instance_variable_set(name, value);
            }
        }
    }

    @JRubyClass(name = "Object", parent = "AbstractObject")
    public static class Object extends RubyObject {

        public Object(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }
    }

    @JRubyClass(name = "AbstractLockableObject", parent = "Object")
    public static class AbstractLockableObject extends Object {

        public AbstractLockableObject(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }
    }

    @JRubyClass(name = "JRubyLockableObject", parent = "AbstractLockableObject")
    public static class JRubyLockableObject extends AbstractLockableObject {

        public JRubyLockableObject(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }

        @JRubyMethod(name = "synchronize", visibility = Visibility.PROTECTED)
        public IRubyObject rubySynchronize(ThreadContext context, Block block) {
            synchronized (this) {
                return block.yield(context, null);
            }
        }

        @JRubyMethod(name = "ns_wait", optional = 1, visibility = Visibility.PROTECTED)
        public IRubyObject nsWait(ThreadContext context, IRubyObject[] args) {
            Ruby runtime = context.runtime;
            if (args.length > 1) {
                throw runtime.newArgumentError(args.length, 1);
            }
            Double timeout = null;
            if (args.length > 0 && !args[0].isNil()) {
                timeout = args[0].convertToFloat().getDoubleValue();
                if (timeout < 0) {
                    throw runtime.newArgumentError("time interval must be positive");
                }
            }
            if (Thread.interrupted()) {
                throw runtime.newConcurrencyError("thread interrupted");
            }
            boolean success = false;
            try {
                success = context.getThread().wait_timeout(this, timeout);
            } catch (InterruptedException ie) {
                throw runtime.newConcurrencyError(ie.getLocalizedMessage());
            } finally {
                // An interrupt or timeout may have caused us to miss
                // a notify that we consumed, so do another notify in
                // case someone else is available to pick it up.
                if (!success) {
                    this.notify();
                }
            }
            return this;
        }

        @JRubyMethod(name = "ns_signal", visibility = Visibility.PROTECTED)
        public IRubyObject nsSignal(ThreadContext context) {
            notify();
            return this;
        }

        @JRubyMethod(name = "ns_broadcast", visibility = Visibility.PROTECTED)
        public IRubyObject nsBroadcast(ThreadContext context) {
            notifyAll();
            return this;
        }
    }

    @JRubyClass(name = "JRuby")
    public static class JRuby extends RubyObject {
        public JRuby(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }

        @JRubyMethod(name = "sleep_interruptibly", visibility = Visibility.PUBLIC, module = true)
        public static IRubyObject sleepInterruptibly(final ThreadContext context, IRubyObject receiver, final Block block) {
            try {
                context.getThread().executeBlockingTask(new RubyThread.BlockingTask() {
                    @Override
                    public void run() throws InterruptedException {
                        block.call(context);
                    }

                    @Override
                    public void wakeup() {
                        context.getThread().getNativeThread().interrupt();
                    }
                });
            } catch (InterruptedException e) {
                throw context.runtime.newThreadError("interrupted in Concurrent::Synchronization::JRuby.sleep_interruptibly");
            }
            return context.nil;
        }
    }
}
