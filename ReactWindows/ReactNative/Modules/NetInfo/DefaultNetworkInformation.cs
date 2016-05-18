using Windows.Networking.Connectivity;

namespace ReactNative.Modules.NetInfo
{
    class DefaultNetworkInformation : INetworkInformation
    {
        public event NetworkStatusChangedEventHandler NetworkStatusChanged;

        public void Start()
        {
            NetworkInformation.NetworkStatusChanged += OnNetworkStatusChanged;
        }

        public void Stop()
        {
            NetworkInformation.NetworkStatusChanged -= OnNetworkStatusChanged;
        }

        public IConnectionProfile GetInternetConnectionProfile()
        {
            var profile = NetworkInformation.GetInternetConnectionProfile();
            var connectivity = profile.GetNetworkConnectivityLevel();
            return profile != null
                ? new ConnectionProfileImpl(profile)
                : null;
        }

        private void OnNetworkStatusChanged(object sender)
        {
            NetworkStatusChanged?.Invoke(sender);
        }

        class ConnectionProfileImpl : IConnectionProfile
        {
            private readonly ConnectionProfile _profile;

            public ConnectionProfileImpl(ConnectionProfile profile)
            {
                _profile = profile;
            }

            public NetworkConnectivityLevel ConnectivityLevel
            {
                get
                {
                    return _profile.GetNetworkConnectivityLevel();
                }
            }
        }
    }
}
