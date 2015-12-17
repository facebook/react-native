namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface that represents a JavaScript callback function that can be
    /// passed to a native module as a method parameter.
    /// </summary>
    public interface ICallback
    {
        /// <summary>
        /// Invokes the callback.
        /// </summary>
        /// <param name="arguments">The callback arguments.</param>
        void Invoke(params object[] arguments);
    }
}
