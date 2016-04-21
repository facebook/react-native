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
            return profile != null
                ? new ConnectionProfileImpl(profile)
                : null;
        }

        private void OnNetworkStatusChanged(object sender)
        {
            var networkStatusChanged = NetworkStatusChanged;
            if (networkStatusChanged != null)
            {
                networkStatusChanged(sender);
            }
        }

        class ConnectionProfileImpl : IConnectionProfile
        {
            private readonly ConnectionProfile _profile;

            public ConnectionProfileImpl(ConnectionProfile profile)
            {
                _profile = profile;
            }

            public bool IsWlanConnectionProfile
            {
                get
                {
                    return _profile.IsWlanConnectionProfile;
                }
            }

            public bool IsWwanConnectionProfile
            {
                get
                {
                    return _profile.IsWwanConnectionProfile;
                }
            }
        }
    }
}
