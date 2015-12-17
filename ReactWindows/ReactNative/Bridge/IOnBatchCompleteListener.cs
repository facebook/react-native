namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface that will be notified when a batch of JavaScript to native
    /// calls has finished.
    /// </summary>
    public interface IOnBatchCompleteListener
    {
        /// <summary>
        /// Invoked when a batch of JavaScript to native calls has finished.
        /// </summary>
        void OnBatchComplete();
    }
}
