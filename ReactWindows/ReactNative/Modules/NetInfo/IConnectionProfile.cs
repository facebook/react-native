namespace ReactNative.Modules.NetInfo
{
    /// <summary>
    /// An interface for network connection profiles.
    /// </summary>
    public interface IConnectionProfile
    {
        /// <summary>
        /// A value that indicates if connection profile is a WLAN (WiFi)
        /// connection.
        /// </summary>
        bool IsWlanConnectionProfile { get; }

        /// <summary>
        /// A value that indicates if connection profile is a WWAN (mobile)
        /// connection.
        /// </summary>
        bool IsWwanConnectionProfile { get; }
    }
}
