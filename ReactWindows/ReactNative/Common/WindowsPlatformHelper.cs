namespace ReactNative.Common
{
    internal enum DeviceFamilyType
    {
        Desktop,
        HoloLens,
        IoT,
        Mobile,
        Team,
        Unknown,
        Xbox
    }

    internal static class WindowsPlatformHelper
    {
        public static DeviceFamilyType DeviceFamily {
            get
            {
                var family = Windows.System.Profile.AnalyticsInfo.VersionInfo.DeviceFamily;
                switch(family)
                {
                    case "Windows.Desktop":
                        return DeviceFamilyType.Desktop;
                    case "Windows.Holographic":
                        return DeviceFamilyType.HoloLens;
                    case "Windows.IoT":
                        return DeviceFamilyType.IoT;
                    case "Windows.Mobile":
                        return DeviceFamilyType.Mobile;
                    case "Windows.Team":
                        return DeviceFamilyType.Team;
                    case "Windows.Xbox":
                        return DeviceFamilyType.Xbox;
                    default:
                        return DeviceFamilyType.Unknown;
                }
            }
        }
    }
}
