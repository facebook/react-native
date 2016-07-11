namespace ReactNative.Bridge
{
    /// <summary>
    /// An interface for invoking methods specified by name.
    /// </summary>
    public interface IInvocationHandler
    {
        /// <summary>
        /// Invoke the specified method.
        /// </summary>
        /// <param name="name">The name of the method.</param>
        /// <param name="args">The arguments for the method.</param>
        void Invoke(string name, object[] args);
    }
}
