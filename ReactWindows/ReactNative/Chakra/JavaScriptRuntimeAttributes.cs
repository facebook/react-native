namespace ReactNative.Chakra
{
    using System;
    using System.Diagnostics.CodeAnalysis;

    /// <summary>
    ///     Attributes of a runtime.
    /// </summary>
    [Flags]
    public enum JavaScriptRuntimeAttributes
    {
        /// <summary>
        ///     No special attributes.
        /// </summary>
        None = 0x00000000,

        /// <summary>
        ///     The runtime will not do any work (such as garbage collection) on background threads.
        /// </summary>
        DisableBackgroundWork = 0x00000001,

        /// <summary>
        ///     The runtime should support reliable script interruption. This increases the number of
        ///     places where the runtime will check for a script interrupt request at the cost of a
        ///     small amount of runtime performance.
        /// </summary>
        AllowScriptInterrupt = 0x00000002,

        /// <summary>
        ///     Host will call Idle, so enable idle processing. Otherwise, the runtime will manage
        ///     memory slightly more aggressively.
        /// </summary>
        EnableIdleProcessing = 0x00000004,

        /// <summary>
        ///     Runtime will not generate native code.
        /// </summary>
        DisableNativeCodeGeneration = 0x00000008,

        /// <summary>
        ///     Using Eval or Function constructor will throw an exception.
        /// </summary>
        [SuppressMessage("StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "Eval is a valid function name.")]
        DisableEval = 0x00000010,
    }
}
