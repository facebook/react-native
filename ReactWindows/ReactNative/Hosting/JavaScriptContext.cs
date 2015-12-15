namespace ReactNative.Hosting
{
    using System;

    /// <summary>
    ///     A script context.
    /// </summary>
    /// <remarks>
    ///     <para>
    ///     Each script context contains its own global object, distinct from the global object in 
    ///     other script contexts.
    ///     </para>
    ///     <para>
    ///     Many Chakra hosting APIs require an "active" script context, which can be set using 
    ///     Current. Chakra hosting APIs that require a current context to be set will note 
    ///     that explicitly in their documentation.
    ///     </para>
    /// </remarks>
    public struct JavaScriptContext
    {
        /// <summary>
        ///     The reference.
        /// </summary>
        private readonly IntPtr reference;

        /// <summary>
        ///     Initializes a new instance of the <see cref="JavaScriptContext"/> struct. 
        /// </summary>
        /// <param name="reference">The reference.</param>
        internal JavaScriptContext(IntPtr reference)
        {
            this.reference = reference;
        }

        /// <summary>
        ///     Gets an invalid context.
        /// </summary>
        public static JavaScriptContext Invalid
        {
            get { return new JavaScriptContext(IntPtr.Zero); }
        }

        /// <summary>
        ///     Gets or sets the current script context on the thread.
        /// </summary>
        public static JavaScriptContext Current
        {
            get
            {
                JavaScriptContext reference;
                Native.ThrowIfError(Native.JsGetCurrentContext(out reference));
                return reference;
            }

            set
            {
                Native.ThrowIfError(Native.JsSetCurrentContext(value));
            }
        }

        /// <summary>
        ///     Gets a value indicating whether the runtime of the current context is in an exception state.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     If a call into the runtime results in an exception (either as the result of running a 
        ///     script or due to something like a conversion failure), the runtime is placed into an 
        ///     "exception state." All calls into any context created by the runtime (except for the 
        ///     exception APIs) will fail with <c>InExceptionState</c> until the exception is 
        ///     cleared.
        ///     </para>
        ///     <para>
        ///     If the runtime of the current context is in the exception state when a callback returns 
        ///     into the engine, the engine will automatically rethrow the exception.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        public static bool HasException
        {
            get
            {
                bool hasException;
                Native.ThrowIfError(Native.JsHasException(out hasException));
                return hasException;
            }
        }

        /// <summary>
        ///     Gets a value indicating whether the heap of the current context is being enumerated.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        public static bool IsEnumeratingHeap
        {
            get
            {
                bool isEnumerating;
                Native.ThrowIfError(Native.JsIsEnumeratingHeap(out isEnumerating));
                return isEnumerating;
            }
        }

        /// <summary>
        ///     Gets the runtime that the context belongs to.
        /// </summary>
        public JavaScriptRuntime Runtime
        {
            get
            {
                JavaScriptRuntime handle;
                Native.ThrowIfError(Native.JsGetRuntime(this, out handle));
                return handle;
            }
        }

        /// <summary>
        ///     Gets a value indicating whether the context is a valid context or not.
        /// </summary>
        public bool IsValid
        {
            get { return reference != IntPtr.Zero; }
        }

        /// <summary>
        ///     Tells the runtime to do any idle processing it need to do.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     If idle processing has been enabled for the current runtime, calling <c>Idle</c> will 
        ///     inform the current runtime that the host is idle and that the runtime can perform 
        ///     memory cleanup tasks.
        ///     </para>
        ///     <para>
        ///     <c>Idle</c> will also return the number of system ticks until there will be more idle work
        ///     for the runtime to do. Calling <c>Idle</c> before this number of ticks has passed will do
        ///     no work.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <returns>
        ///     The next system tick when there will be more idle work to do. Returns the 
        ///     maximum number of ticks if there no upcoming idle work to do.
        /// </returns>
        public static uint Idle()
        {
            uint ticks;
            Native.ThrowIfError(Native.JsIdle(out ticks));
            return ticks;
        }

        /// <summary>
        ///     Parses a script and returns a <c>Function</c> representing the script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to parse.</param>
        /// <param name="sourceContext">
        ///     A cookie identifying the script that can be used by script contexts that have debugging enabled.
        /// </param>
        /// <param name="sourceName">The location the script came from.</param>
        /// <returns>A <c>Function</c> representing the script code.</returns>
        public static JavaScriptValue ParseScript(string script, JavaScriptSourceContext sourceContext, string sourceName)
        {
            JavaScriptValue result;
            Native.ThrowIfError(Native.JsParseScript(script, sourceContext, sourceName, out result));
            return result;
        }

        /// <summary>
        ///     Parses a serialized script and returns a <c>Function</c> representing the script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to parse.</param>
        /// <param name="buffer">The serialized script.</param>
        /// <param name="sourceContext">
        ///     A cookie identifying the script that can be used by script contexts that have debugging enabled.
        /// </param>
        /// <param name="sourceName">The location the script came from.</param>
        /// <returns>A <c>Function</c> representing the script code.</returns>
        public static JavaScriptValue ParseScript(string script, byte[] buffer, JavaScriptSourceContext sourceContext, string sourceName)
        {
            JavaScriptValue result;
            Native.ThrowIfError(Native.JsParseSerializedScript(script, buffer, sourceContext, sourceName, out result));
            return result;
        }

        /// <summary>
        ///     Parses a script and returns a <c>Function</c> representing the script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to parse.</param>
        /// <returns>A <c>Function</c> representing the script code.</returns>
        public static JavaScriptValue ParseScript(string script)
        {
            return ParseScript(script, JavaScriptSourceContext.None, string.Empty);
        }

        /// <summary>
        ///     Parses a serialized script and returns a <c>Function</c> representing the script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to parse.</param>
        /// <param name="buffer">The serialized script.</param>
        /// <returns>A <c>Function</c> representing the script code.</returns>
        public static JavaScriptValue ParseScript(string script, byte[] buffer)
        {
            return ParseScript(script, buffer, JavaScriptSourceContext.None, string.Empty);
        }

        /// <summary>
        ///     Executes a script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to run.</param>
        /// <param name="sourceContext">
        ///     A cookie identifying the script that can be used by script contexts that have debugging enabled.
        /// </param>
        /// <param name="sourceName">The location the script came from.</param>
        /// <returns>The result of the script, if any.</returns>
        public static JavaScriptValue RunScript(string script, JavaScriptSourceContext sourceContext, string sourceName)
        {
            JavaScriptValue result;
            Native.ThrowIfError(Native.JsRunScript(script, sourceContext, sourceName, out result));
            return result;
        }

        /// <summary>
        ///     Runs a serialized script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The source code of the serialized script.</param>
        /// <param name="buffer">The serialized script.</param>
        /// <param name="sourceContext">
        ///     A cookie identifying the script that can be used by script contexts that have debugging enabled.
        /// </param>
        /// <param name="sourceName">The location the script came from.</param>
        /// <returns>The result of the script, if any.</returns>
        public static JavaScriptValue RunScript(string script, byte[] buffer, JavaScriptSourceContext sourceContext, string sourceName)
        {
            JavaScriptValue result;
            Native.ThrowIfError(Native.JsRunSerializedScript(script, buffer, sourceContext, sourceName, out result));
            return result;
        }

        /// <summary>
        ///     Executes a script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The script to run.</param>
        /// <returns>The result of the script, if any.</returns>
        public static JavaScriptValue RunScript(string script)
        {
            return RunScript(script, JavaScriptSourceContext.None, string.Empty);
        }

        /// <summary>
        ///     Runs a serialized script.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="script">The source code of the serialized script.</param>
        /// <param name="buffer">The serialized script.</param>
        /// <returns>The result of the script, if any.</returns>
        public static JavaScriptValue RunScript(string script, byte[] buffer)
        {
            return RunScript(script, buffer, JavaScriptSourceContext.None, string.Empty);
        }

        /// <summary>
        ///     Serializes a parsed script to a buffer than can be reused.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     SerializeScript parses a script and then stores the parsed form of the script in a 
        ///     runtime-independent format. The serialized script then can be deserialized in any
        ///     runtime without requiring the script to be re-parsed.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <param name="script">The script to serialize.</param>
        /// <param name="buffer">The buffer to put the serialized script into. Can be null.</param>
        /// <returns>
        ///     The size of the buffer, in bytes, required to hold the serialized script.
        /// </returns>
        public static ulong SerializeScript(string script, byte[] buffer)
        {
            var bufferSize = (ulong)buffer.Length;
            Native.ThrowIfError(Native.JsSerializeScript(script, buffer, ref bufferSize));
            return bufferSize;
        }

        /// <summary>
        ///     Returns the exception that caused the runtime of the current context to be in the 
        ///     exception state and resets the exception state for that runtime.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     If the runtime of the current context is not in an exception state, this API will throw
        ///     <c>JsErrorInvalidArgument</c>. If the runtime is disabled, this will return an exception
        ///     indicating that the script was terminated, but it will not clear the exception (the 
        ///     exception will be cleared if the runtime is re-enabled using 
        ///     <c>EnableRuntimeExecution</c>).
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <returns>The exception for the runtime of the current context.</returns>
        public static JavaScriptValue GetAndClearException()
        {
            JavaScriptValue reference;
            Native.ThrowIfError(Native.JsGetAndClearException(out reference));
            return reference;
        }

        /// <summary>
        ///     Sets the runtime of the current context to an exception state.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     If the runtime of the current context is already in an exception state, this API will 
        ///     throw <c>JsErrorInExceptionState</c>.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <param name="exception">
        ///     The JavaScript exception to set for the runtime of the current context.
        /// </param>
        public static void SetException(JavaScriptValue exception)
        {
            Native.ThrowIfError(Native.JsSetException(exception));
        }

#if RELEASE64
        /// <summary>
        ///     Starts debugging in the context.
        /// </summary>
        /// <param name="debugApplication">The debug application to use for debugging.</param>
        public static void StartDebugging(Native.IDebugApplication64 debugApplication)
        {
            Native.ThrowIfError(Native.JsStartDebugging(debugApplication));
        }
#endif

        /// <summary>
        ///     Starts debugging in the context.
        /// </summary>
        /// <param name="debugApplication">The debug application to use for debugging.</param>
        public static void StartDebugging(Native.IDebugApplication32 debugApplication)
        {
            Native.ThrowIfError(Native.JsStartDebugging(debugApplication));
        }

        /// <summary>
        ///     Starts profiling in the current context.
        /// </summary>
        /// <remarks>
        ///     Requires an active script context.
        /// </remarks>
        /// <param name="callback">The profiling callback to use.</param>
        /// <param name="eventMask">The profiling events to callback with.</param>
        /// <param name="context">A context to pass to the profiling callback.</param>
        public static void StartProfiling(Native.IActiveScriptProfilerCallback callback, Native.ProfilerEventMask eventMask, int context)
        {
            Native.ThrowIfError(Native.JsStartProfiling(callback, eventMask, context));
        }

        /// <summary>
        ///     Stops profiling in the current context.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     Will not return an error if profiling has not started.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <param name="reason">
        ///     The reason for stopping profiling to pass to the profiler callback.
        /// </param>
        public static void StopProfiling(int reason)
        {
            Native.ThrowIfError(Native.JsStopProfiling(reason));
        }

        /// <summary>
        ///     Enumerates the heap of the current context.
        /// </summary>
        /// <remarks>
        ///     <para>
        ///     While the heap is being enumerated, the current context cannot be removed, and all calls to
        ///     modify the state of the context will fail until the heap enumerator is released.
        ///     </para>
        ///     <para>
        ///     Requires an active script context.
        ///     </para>
        /// </remarks>
        /// <returns>A heap enumerator.</returns>
        public static Native.IActiveScriptProfilerHeapEnum EnumerateHeap()
        {
            Native.IActiveScriptProfilerHeapEnum enumerator;
            Native.ThrowIfError(Native.JsEnumerateHeap(out enumerator));
            return enumerator;
        }

        /// <summary>
        ///     Adds a reference to a script context.
        /// </summary>
        /// <remarks>
        ///     Calling AddRef ensures that the context will not be freed until Release is called.
        /// </remarks>
        /// <returns>The object's new reference count.</returns>
        public uint AddRef()
        {
            uint count;
            Native.ThrowIfError(Native.JsContextAddRef(this, out count));
            return count;
        }

        /// <summary>
        ///     Releases a reference to a script context.
        /// </summary>
        /// <remarks>
        ///     Removes a reference to a context that was created by AddRef.
        /// </remarks>
        /// <returns>The object's new reference count.</returns>
        public uint Release()
        {
            uint count;
            Native.ThrowIfError(Native.JsContextRelease(this, out count));
            return count;
        }

        /// <summary>
        ///     A scope automatically sets a context to current and resets the original context
        ///     when disposed.
        /// </summary>
        public struct Scope : IDisposable
        {
            /// <summary>
            ///     The previous context.
            /// </summary>
            private readonly JavaScriptContext previousContext;

            /// <summary>
            ///     Whether the structure has been disposed.
            /// </summary>
            private bool disposed;

            /// <summary>
            ///     Initializes a new instance of the <see cref="Scope"/> struct. 
            /// </summary>
            /// <param name="context">The context to create the scope for.</param>
            public Scope(JavaScriptContext context)
            {
                disposed = false;
                previousContext = Current;
                Current = context;
            }

            /// <summary>
            ///     Disposes the scope and sets the previous context to current.
            /// </summary>
            public void Dispose()
            {
                if (disposed)
                {
                    return;
                }

                Current = previousContext;
                disposed = true;
            }
        }
    }
}
