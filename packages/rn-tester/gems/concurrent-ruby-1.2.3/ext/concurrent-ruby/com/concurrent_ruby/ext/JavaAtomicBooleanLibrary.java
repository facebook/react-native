package com.concurrent_ruby.ext;

import org.jruby.Ruby;
import org.jruby.RubyBoolean;
import org.jruby.RubyClass;
import org.jruby.RubyModule;
import org.jruby.RubyNil;
import org.jruby.RubyObject;
import org.jruby.anno.JRubyClass;
import org.jruby.anno.JRubyMethod;
import org.jruby.runtime.ObjectAllocator;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.runtime.load.Library;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;

public class JavaAtomicBooleanLibrary implements Library {

    public void load(Ruby runtime, boolean wrap) throws IOException {
        RubyModule concurrentMod = runtime.defineModule("Concurrent");
        RubyClass atomicCls = concurrentMod.defineClassUnder("JavaAtomicBoolean", runtime.getObject(), JRUBYREFERENCE_ALLOCATOR);
        atomicCls.defineAnnotatedMethods(JavaAtomicBoolean.class);
    }

    private static final ObjectAllocator JRUBYREFERENCE_ALLOCATOR = new ObjectAllocator() {
        public IRubyObject allocate(Ruby runtime, RubyClass klazz) {
            return new JavaAtomicBoolean(runtime, klazz);
        }
    };

    @JRubyClass(name = "JavaAtomicBoolean", parent = "Object")
    public static class JavaAtomicBoolean extends RubyObject {

        private AtomicBoolean atomicBoolean;

        public JavaAtomicBoolean(Ruby runtime, RubyClass metaClass) {
            super(runtime, metaClass);
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context, IRubyObject value) {
            atomicBoolean = new AtomicBoolean(convertRubyBooleanToJavaBoolean(value));
            return context.nil;
        }

        @JRubyMethod
        public IRubyObject initialize(ThreadContext context) {
            atomicBoolean = new AtomicBoolean();
            return context.nil;
        }

        @JRubyMethod(name = "value")
        public IRubyObject value() {
            return getRuntime().newBoolean(atomicBoolean.get());
        }

        @JRubyMethod(name = "true?")
        public IRubyObject isAtomicTrue() {
            return getRuntime().newBoolean(atomicBoolean.get());
        }

        @JRubyMethod(name = "false?")
        public IRubyObject isAtomicFalse() {
            return getRuntime().newBoolean((atomicBoolean.get() == false));
        }

        @JRubyMethod(name = "value=")
        public IRubyObject setAtomic(ThreadContext context, IRubyObject newValue) {
            atomicBoolean.set(convertRubyBooleanToJavaBoolean(newValue));
            return context.nil;
        }

        @JRubyMethod(name = "make_true")
        public IRubyObject makeTrue() {
            return getRuntime().newBoolean(atomicBoolean.compareAndSet(false, true));
        }

        @JRubyMethod(name = "make_false")
        public IRubyObject makeFalse() {
            return getRuntime().newBoolean(atomicBoolean.compareAndSet(true, false));
        }

        private boolean convertRubyBooleanToJavaBoolean(IRubyObject newValue) {
            if (newValue instanceof RubyBoolean.False || newValue instanceof RubyNil) {
                return false;
            } else {
                return true;
            }
        }
    }
}
