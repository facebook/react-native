namespace ReactNative.Hosting
{
    using System.Diagnostics.CodeAnalysis;

    /// <summary>
    ///     An error code returned from a Chakra hosting API.
    /// </summary>
    public enum JavaScriptErrorCode : uint
    {
        /// <summary>
        ///     Success error code.
        /// </summary>
        NoError = 0,

        /// <summary>
        ///     Category of errors that relates to incorrect usage of the API itself.
        /// </summary>
        CategoryUsage = 0x10000,

        /// <summary>
        ///     An argument to a hosting API was invalid.
        /// </summary>
        InvalidArgument,
        
        /// <summary>
        ///     An argument to a hosting API was null in a context where null is not allowed.
        /// </summary>
        NullArgument,
        
        /// <summary>
        ///     The hosting API requires that a context be current, but there is no current context.
        /// </summary>
        NoCurrentContext,
        
        /// <summary>
        ///     The engine is in an exception state and no APIs can be called until the exception is 
        ///     cleared.
        /// </summary>
        InExceptionState,
        
        /// <summary>
        ///     A hosting API is not yet implemented.
        /// </summary>
        NotImplemented,
        
        /// <summary>
        ///     A hosting API was called on the wrong thread.
        /// </summary>
        WrongThread,
        
        /// <summary>
        ///     A runtime that is still in use cannot be disposed.
        /// </summary>
        RuntimeInUse,
        
        /// <summary>
        ///     A bad serialized script was used, or the serialized script was serialized by a 
        ///     different version of the Chakra engine.
        /// </summary>
        BadSerializedScript,
        
        /// <summary>
        ///     The runtime is in a disabled state.
        /// </summary>
        InDisabledState,
        
        /// <summary>
        ///     Runtime does not support reliable script interruption.
        /// </summary>
        CannotDisableExecution,
        
        /// <summary>
        ///     A heap enumeration is currently underway in the script context.
        /// </summary>
        HeapEnumInProgress,
        
        /// <summary>
        ///     A hosting API that operates on Object values was called with a non-Object value.
        /// </summary>
        ArgumentNotObject,
        
        /// <summary>
        ///     A script context is in the middle of a profile callback.
        /// </summary>
        InProfileCallback,
        
        /// <summary>
        ///     A thread service callback is currently underway.
        /// </summary>
        InThreadServiceCallback,
        
        /// <summary>
        ///     Scripts cannot be serialized in debug contexts.
        /// </summary>
        CannotSerializeDebugScript,
        
        /// <summary>
        ///     The context cannot be put into a debug state because it is already in a debug state.
        /// </summary>
        AlreadyDebuggingContext,

        /// <summary>
        ///     The context cannot start profiling because it is already profiling.
        /// </summary>
        AlreadyProfilingContext,

        /// <summary>
        ///     Idle notification given when the host did not enable idle processing.
        /// </summary>
        IdleNotEnabled,

        /// <summary>
        ///     Category of errors that relates to errors occurring within the engine itself.
        /// </summary>
        CategoryEngine = 0x20000,
        
        /// <summary>
        ///     The Chakra engine has run out of memory.
        /// </summary>
        OutOfMemory,

        /// <summary>
        ///     Category of errors that relates to errors in a script.
        /// </summary>
        CategoryScript = 0x30000,
        
        /// <summary>
        ///     A JavaScript exception occurred while running a script.
        /// </summary>
        ScriptException,
        
        /// <summary>
        ///     JavaScript failed to compile.
        /// </summary>
        ScriptCompile,
        
        /// <summary>
        ///     A script was terminated due to a request to suspend a runtime.
        /// </summary>
        ScriptTerminated,

        /// <summary>
        ///     A script was terminated because it tried to use "eval" or "function" and eval was disabled.
        /// </summary>
        [SuppressMessage("StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "Eval is a valid function name.")]
        ScriptEvalDisabled,

        /// <summary>
        ///     Category of errors that are fatal and signify failure of the engine.
        /// </summary>
        CategoryFatal = 0x40000,
        
        /// <summary>
        ///     A fatal error in the engine has occurred.
        /// </summary>
        Fatal,
    }
}
