using ReactNative.Bridge;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// JavaScript module for HMRClient.
    /// 
    /// The HMR(Hot Module Replacement)Client allows for the application to
    /// receive updates from the packager server (over a web socket), allowing
    /// for injection of JavaScript to the running application (without a 
    /// refresh).
    /// </summary>
    public class HMRClient : JavaScriptModuleBase
    {
        /// <summary>
        /// Enable the HMRClient so that the client will receive updates from
        /// the packager server.
        /// </summary>
        /// <param name="platform">
        /// The platform in which HMR updates will be enabled.
        /// </param>
        /// <param name="bundleEntry">
        /// The path to the bundle entry file (e.g., index.windows.bundle).
        /// </param>
        /// <param name="host">
        /// The host that the HMRClient should communicate with.
        /// </param>
        /// <param name="port">
        /// The port that the HMRClient should communicate with on the host.
        /// </param>
        public void enable(string platform, string bundleEntry, string host, int port)
        {
            Invoke(platform, bundleEntry, host, port);
        }
    }
}
