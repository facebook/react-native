namespace ReactNative.Hosting
{
    /// <summary>
    ///     Version of the runtime.
    /// </summary>
    public enum JavaScriptRuntimeVersion
    {
        /// <summary>
        ///     Create runtime with IE10 version.
        /// </summary>
        Version10 = 0,

        /// <summary>
        ///     Create runtime with IE11 version.
        /// </summary>
        Version11 = 1,

        /// <summary>
        ///     Create runtime with highest version present on the machine at runtime.
        /// </summary>
        VersionEdge = -1,
    }
}
