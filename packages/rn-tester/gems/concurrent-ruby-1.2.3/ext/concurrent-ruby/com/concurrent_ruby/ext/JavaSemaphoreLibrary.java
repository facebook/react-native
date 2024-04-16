package com.concurrent_ruby.ext;

import java.io.IOException;
import java.util.concurrent.Semaphore;
import org.jruby.Ruby;
import org.jruby.RubyClass;
import org.jruby.RubyFixnum;
import org.jruby.RubyModule;
import org.jruby.RubyNumeric;
import org.jruby.RubyObject;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import org.jruby.runtime.Block;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;

public class JavaSemaphoreLibrary {

    public void load(Ruby runtime, boolean wrap) throws IOException {
        RubyModule concurrentMod = runtime.defineModule("Concurrent");
        RubyClass atomicCls = concurrentMod.defineClassUnder("JavaSemaphore", runtime.getObject(), JRUBYREFERENCE_ALLOCATOR);

        atomicCls.defineAnnotatedMethods(JavaSemaphore.class);
    }

    private static final ObjectAllocator JRUBYREFERENCE_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JavaSemaphore(runtime, klazz);
        }
    };

    @JRubyClass(name = "JavaSemaphore", parent = "Object")
    public static class JavaSemaphore extends RubyObject {

        private JRubySemaphore semaphore;

        public JavaSemaphore(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context, IRubyObject value) {
            this.semaphore = new JRubySemaphore(rubyFixnumInt(value, "count"));
            return context.nil;
        }

        @JRubyMethod
        public IRubyObject acquire(ThreadContext context, final Block block) throws InterruptedException {
            return this.acquire(context, 1, block);
        }

        @JRubyMethod
        public IRubyObject acquire(ThreadContext context, IRubyObject permits, final Block block) throws InterruptedException {
            return this.acquire(context, rubyFixnumToPositiveInt(permits, "permits"), block);
        }

        @JRubyMethod(name = "available_permits")
        public IRubyObject availablePermits(ThreadContext context) {
            return getRuntime().newFixnum(this.semaphore.availablePermits());
        }

        @JRubyMethod(name = "drain_permits")
        public IRubyObject drainPermits(ThreadContext context) {
            return getRuntime().newFixnum(this.semaphore.drainPermits());
        }

        @JRubyMethod(name = "try_acquire")
        public IRubyObject tryAcquire(ThreadContext context, final Block block) throws InterruptedException {
            int permitsInt = 1;
            boolean acquired = semaphore.tryAcquire(permitsInt);

            return triedAcquire(context, permitsInt, acquired, block);
        }

        @JRubyMethod(name = "try_acquire")
        public IRubyObject tryAcquire(ThreadContext context, IRubyObject permits, final Block block) throws InterruptedException {
            int permitsInt = rubyFixnumToPositiveInt(permits, "permits");
            boolean acquired = semaphore.tryAcquire(permitsInt);

            return triedAcquire(context, permitsInt, acquired, block);
        }

        @JRubyMethod(name = "try_acquire")
        public IRubyObject tryAcquire(ThreadContext context, IRubyObject permits, IRubyObject timeout, final Block block) throws InterruptedException {
            int permitsInt = rubyFixnumToPositiveInt(permits, "permits");
            boolean acquired = semaphore.tryAcquire(
                    permitsInt,
                    rubyNumericToLong(timeout, "timeout"),
                    java.util.concurrent.TimeUnit.SECONDS
                    );

            return triedAcquire(context, permitsInt, acquired, block);
        }

        @JRubyMethod
        public IRubyObject release(ThreadContext context) {
            this.semaphore.release(1);
            return getRuntime().newBoolean(true);
        }

        @JRubyMethod
        public IRubyObject release(ThreadContext context, IRubyObject permits) {
            this.semaphore.release(rubyFixnumToPositiveInt(permits, "permits"));
            return getRuntime().newBoolean(true);
        }

        @JRubyMethod(name = "reduce_permits")
        public IRubyObject reducePermits(ThreadContext context, IRubyObject reduction) throws InterruptedException {
            this.semaphore.publicReducePermits(rubyFixnumToNonNegativeInt(reduction, "reduction"));
            return context.nil;
        }

        private IRubyObject acquire(ThreadContext context, int permits, final Block block) throws InterruptedException {
            this.semaphore.acquire(permits);

            if (!block.isGiven()) return context.nil;

            try {
                return block.yieldSpecific(context);
            } finally {
                this.semaphore.release(permits);
            }
        }

        private IRubyObject triedAcquire(ThreadContext context, int permits, boolean acquired, final Block block) {
            if (!block.isGiven()) return getRuntime().newBoolean(acquired);
            if (!acquired) return context.nil;

            try {
                return block.yieldSpecific(context);
            } finally {
                this.semaphore.release(permits);
            }
        }

        private int rubyFixnumInt(IRubyObject value, String paramName) {
            if (value instanceof RubyFixnum) {
                RubyFixnum fixNum = (RubyFixnum) value;
                return (int) fixNum.getLongValue();
            } else {
                throw getRuntime().newArgumentError(paramName + " must be integer");
            }
        }

        private int rubyFixnumToNonNegativeInt(IRubyObject value, String paramName) {
            if (value instanceof RubyFixnum && ((RubyFixnum) value).getLongValue() >= 0) {
                RubyFixnum fixNum = (RubyFixnum) value;
                return (int) fixNum.getLongValue();
            } else {
                throw getRuntime().newArgumentError(paramName + " must be a non-negative integer");
            }
        }

        private int rubyFixnumToPositiveInt(IRubyObject value, String paramName) {
            if (value instanceof RubyFixnum && ((RubyFixnum) value).getLongValue() > 0) {
                RubyFixnum fixNum = (RubyFixnum) value;
                return (int) fixNum.getLongValue();
            } else {
                throw getRuntime().newArgumentError(paramName + " must be an integer greater than zero");
            }
        }

        private long rubyNumericToLong(IRubyObject value, String paramName) {
            if (value instanceof RubyNumeric && ((RubyNumeric) value).getDoubleValue() > 0) {
                RubyNumeric fixNum = (RubyNumeric) value;
                return fixNum.getLongValue();
            } else {
                throw getRuntime().newArgumentError(paramName + " must be a float greater than zero");
            }
        }

        class JRubySemaphore extends Semaphore {

            public JRubySemaphore(int permits) {
                super(permits);
            }

            public JRubySemaphore(int permits, boolean value) {
                super(permits, value);
            }

            public void publicReducePermits(int i) {
                reducePermits(i);
            }

        }
    }
}
