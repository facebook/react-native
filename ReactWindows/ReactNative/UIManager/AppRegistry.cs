using Newtonsoft.Json.Linq;
using ReactNative.Bridge;

namespace ReactNative.UIManager
{
    /// <summary>
    /// The application registry.
    /// </summary>
    public class AppRegistry : JavaScriptModuleBase
    {
        /// <summary>
        /// Run the application.
        /// </summary>
        /// <param name="appKey">The app key.</param>
        /// <param name="appParameters">The app parameters.</param>
        void runApplication(string appKey, JObject appParameters)
        {
            Invoke(nameof(runApplication), appKey, appParameters);
        }

        /// <summary>
        /// Unmount the application.
        /// </summary>
        /// <param name="rootTagNode">The root tag node.</param>
        void unmountApplicationComponentAtRootTag(int rootTagNode)
        {
            Invoke(nameof(unmountApplicationComponentAtRootTag), rootTagNode);
        }
    }
}
