namespace ReactNative.Bridge
{
    /// <summary>
    /// An interface for JavaScript modules.
    /// </summary>
    public interface IJavaScriptModule
    {
        /// <summary>
        /// The invocation handler.
        /// </summary>
        IInvocationHandler InvocationHandler { set; }
    }
}
