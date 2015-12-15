namespace ReactNative.Hosting
{
    using System;

    /// <summary>
    ///     A callback called before collection.
    /// </summary>
    /// <param name="callbackState">The state passed to SetBeforeCollectCallback.</param>
    public delegate void JavaScriptBeforeCollectCallback(IntPtr callbackState);
}
