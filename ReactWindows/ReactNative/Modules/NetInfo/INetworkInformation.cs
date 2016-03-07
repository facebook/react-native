using Windows.Networking.Connectivity;

namespace ReactNative.Modules.NetInfo
{
    /// <summary>
    /// An interface for network information status and updates.
    /// </summary>
    public interface INetworkInformation
    {
        /// <summary>
        /// An event that occurs whenever the network status changes.
        /// </summary>
        event NetworkStatusChangedEventHandler NetworkStatusChanged;

        /// <summary>
        /// Gets the connection profile associated with the internet connection
        /// currently used by the local machine.
        /// </summary>
        /// <returns>
        /// The profile for the connection currently used to connect the machine
        /// to the Internet, or null if there is no connection profile with a 
        /// suitable connection.
        /// </returns>
        IConnectionProfile GetInternetConnectionProfile();

        /// <summary>
        /// Starts observing network status changes.
        /// </summary>
        void Start();

        /// <summary>
        /// Stops observing network status changes.
        /// </summary>
        void Stop();
    }
}
