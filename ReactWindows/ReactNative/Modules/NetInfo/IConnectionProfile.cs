namespace ReactNative.Modules.NetInfo
{
    public interface IConnectionProfile
    {
        bool IsWlanConnectionProfile { get; }

        bool IsWwanConnectionProfile { get; }
    }
}
