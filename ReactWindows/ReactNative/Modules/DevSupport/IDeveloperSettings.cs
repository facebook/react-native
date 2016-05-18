namespace ReactNative.Modules.DevSupport
{
    /// <summary>
    /// Provides access to React Native developer settings.
    /// </summary>
    public interface IDeveloperSettings
    {
        /// <summary>
        /// Signals whether an overlay showing current FPS should be shown.
        /// </summary>
        bool IsFpsDebugEnabled { get; }

        /// <summary>
        /// Signals whether debug information about transitions should be displayed.
        /// </summary>
        bool IsAnimationFpsDebugEnabled { get; }

        /// <summary>
        /// Signals whether dev mode should be enabled in JavaScript bundles.
        /// </summary>
        bool IsJavaScriptDevModeEnabled { get; }

        /// <summary>
        /// Signals whether JavaScript bundle should be minified.
        /// </summary>
        bool IsJavaScriptMinifyEnabled { get; }

        /// <summary>
        /// Signals whether element inspector is enabled.
        /// </summary>
        bool IsElementInspectorEnabled { get; }
    }
}
