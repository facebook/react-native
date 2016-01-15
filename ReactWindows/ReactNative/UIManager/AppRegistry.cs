using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// The application registry.
    /// </summary>
    public sealed class AppRegistry : JavaScriptModuleBase
    {
        /// <summary>
        /// Run the application.
        /// </summary>
        /// <param name="appKey">The app key.</param>
        /// <param name="appParameters">The app parameters.</param>
        public void runApplication(string appKey, IDictionary<string, object> appParameters)
        {
            Invoke(appKey, appParameters);
        }

        /// <summary>
        /// Unmount the application.
        /// </summary>
        /// <param name="rootTagNode">The root tag node.</param>
        public void unmountApplicationComponentAtRootTag(int rootTagNode)
        {
            Invoke(rootTagNode);
        }
    }
}
