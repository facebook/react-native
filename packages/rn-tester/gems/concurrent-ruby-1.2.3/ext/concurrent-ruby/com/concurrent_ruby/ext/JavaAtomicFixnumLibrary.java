package com.concurrent_ruby.ext;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicLong;
import org.jruby.Ruby;
import org.jruby.RubyClass;
import org.jruby.RubyFixnum;
import org.jruby.RubyModule;
import org.jruby.RubyObject;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.runtime.load.Library;
import org.jruby.runtime.Block;

public class JavaAtomicFixnumLibrary implements Library {

    public void load(Ruby runtime, boolean wrap) throws IOException {
        RubyModule concurrentMod = runtime.defineModule("Concurrent");
        RubyClass atomicCls = concurrentMod.defineClassUnder("JavaAtomicFixnum", runtime.getObject(), JRUBYREFERENCE_ALLOCATOR);

        atomicCls.defineAnnotatedMethods(JavaAtomicFixnum.class);
    }

    private static final ObjectAllocator JRUBYREFERENCE_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JavaAtomicFixnum(runtime, klazz);
        }
    };

    @JRubyClass(name = "JavaAtomicFixnum", parent = "Object")
    public static class JavaAtomicFixnum extends RubyObject {

        private AtomicLong atomicLong;

        public JavaAtomicFixnum(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context) {
            this.atomicLong = new AtomicLong(0);
            return context.nil;
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context, IRubyObject value) {
            this.atomicLong = new AtomicLong(rubyFixnumToLong(value));
            return context.nil;
        }

        @JRubyMethod(name = "value")
        public IRubyObject getValue() {
            return getRuntime().newFixnum(atomicLong.get());
        }

        @JRubyMethod(name = "value=")
        public IRubyObject setValue(ThreadContext context, IRubyObject newValue) {
            atomicLong.set(rubyFixnumToLong(newValue));
            return context.nil;
        }

        @JRubyMethod(name = {"increment", "up"})
        public IRubyObject increment() {
            return getRuntime().newFixnum(atomicLong.incrementAndGet());
        }

        @JRubyMethod(name = {"increment", "up"})
        public IRubyObject increment(IRubyObject value) {
            long delta = rubyFixnumToLong(value);
            return getRuntime().newFixnum(atomicLong.addAndGet(delta));
        }

        @JRubyMethod(name = {"decrement", "down"})
        public IRubyObject decrement() {
            return getRuntime().newFixnum(atomicLong.decrementAndGet());
        }

        @JRubyMethod(name = {"decrement", "down"})
        public IRubyObject decrement(IRubyObject value) {
            long delta = rubyFixnumToLong(value);
            return getRuntime().newFixnum(atomicLong.addAndGet(-delta));
        }

        @JRubyMethod(name = "compare_and_set")
        public IRubyObject compareAndSet(ThreadContext context, IRubyObject expect, IRubyObject update) {
            return getRuntime().newBoolean(atomicLong.compareAndSet(rubyFixnumToLong(expect), rubyFixnumToLong(update)));
        }

        @JRubyMethod
        public IRubyObject update(ThreadContext context, Block block) {
            for (;;) {
                long _oldValue       = atomicLong.get();
                IRubyObject oldValue = getRuntime().newFixnum(_oldValue);
                IRubyObject newValue = block.yield(context, oldValue);
                if (atomicLong.compareAndSet(_oldValue, rubyFixnumToLong(newValue))) {
                    return newValue;
                }
            }
        }

        private long rubyFixnumToLong(IRubyObject value) {
            if (value instanceof RubyFixnum) {
                RubyFixnum fixNum = (RubyFixnum) value;
                return fixNum.getLongValue();
            } else {
                throw getRuntime().newArgumentError("value must be a Fixnum");
            }
        }
    }
}
