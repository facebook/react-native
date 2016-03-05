using Windows.Networking.Connectivity;

namespace ReactNative.Modules.NetInfo
{
    public interface INetworkInformation
    {
        IConnectionProfile GetInternetConnectionProfile();

        void Start();

        void Stop();

        event NetworkStatusChangedEventHandler NetworkStatusChanged;
    }
}
