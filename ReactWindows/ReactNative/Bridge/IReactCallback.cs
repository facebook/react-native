using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Interface that represents a native callback that can be invoked from
    /// JavaScript.
    /// </summary>
    public interface IReactCallback
    {
        /// <summary>
        /// Invoke the native callback.
        /// </summary>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="methodId">The method ID.</param>
        /// <param name="parameters">The parameters.</param>
        void Invoke(int moduleId, int methodId, JArray parameters);

        /// <summary>
        /// Signals that a batch of operations is complete.
        /// </summary>
        void OnBatchComplete();
    }
}
