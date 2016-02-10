using Newtonsoft.Json.Linq;
using System;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// Interface for accessing and interacting with development features.
    /// In Debug builds, use <see cref="DevSupportManager"/>; for release, use
    /// <see cref="DisabledDevSupportManager"/>.
    /// </summary>
    public interface IDevSupportManager
    {
        /// <summary>
        /// Enables or disables the instance.
        /// </summary>
        bool IsEnabled { get; set; }

        /// <summary>
        /// The source URL.
        /// </summary>
        string SourceUrl { get; }

        /// <summary>
        /// The source map URL.
        /// </summary>
        string SourceMapUrl { get; }

        /// <summary>
        /// The cached JavaScript bundle.
        /// </summary>
        string CachedJavaScriptBundleFile { get; }

        /// <summary>
        /// Handle a native exception.
        /// </summary>
        /// <param name="exception">The exception.</param>
        void HandleException(Exception exception);

        /// <summary>
        /// Handles reloading the JavaScript bundle.
        /// </summary>
        void HandleReloadJavaScript();

        /// <summary>
        /// Show the developer options dialog.
        /// </summary>
        void ShowDevOptionsDialog();

        /// <summary>
        /// Display a JavaScript error.
        /// </summary>
        /// <param name="title">The error message.</param>
        /// <param name="details">The error stack trace.</param>
        /// <param name="exceptionId">An identifier for the exception.</param>
        void ShowNewJavaScriptError(string title, JArray details, int exceptionId);

        /// <summary>
        /// Display a native exception.
        /// </summary>
        /// <param name="message">The error message.</param>
        /// <param name="ex">The thrown exception.</param>
        void ShowNewNativeError(string message, Exception ex);

        /// <summary>
        /// Update the details of a JavaScript exception.
        /// </summary>
        /// <param name="title">The error message.</param>
        /// <param name="details">The error stack trace.</param>
        /// <param name="exceptionId">An identifier for the exception.</param>
        void UpdateJavaScriptError(string title, JArray details, int exceptionId);
    }
}