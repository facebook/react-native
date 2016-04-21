using System;
using ReactNative.Bridge;
using Windows.Phone.Devices.Notification;

namespace ReactNative.Modules.Vibration
{
    /// <summary>
    /// Represents the module for vibration.  Note this is only available on Windows Mobile.
    /// </summary>
    public class VibrationModule : NativeModuleBase
    {
        private readonly bool _isMobile;

        internal VibrationModule() : this(IsMobile())
        {
        }

        internal VibrationModule(bool isMobile)
        {
            _isMobile = isMobile;
        }

        private static bool IsMobile()
        {
            var platformFamily = Windows.System.Profile.AnalyticsInfo.VersionInfo.DeviceFamily;
            return platformFamily == "Windows.Mobile";
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "Vibration";
            }
        }

        /// <summary>
        /// Vibrates the device for one second.
        /// </summary>
        /// <param name="duration">The duration in milliseconds to vibrate.</param>
        [ReactMethod]
        public void vibrate(int duration)
        {
            if (_isMobile)
            {
                var vibrationDevice = VibrationDevice.GetDefault();
                vibrationDevice.Vibrate(TimeSpan.FromMilliseconds(duration));
            }
        }

        /// <summary>
        /// Cancels the current vibration.
        /// </summary>
        [ReactMethod]
        public void cancel()
        {
            if (_isMobile)
            {
                var vibrationDevice = VibrationDevice.GetDefault();
                vibrationDevice.Cancel();
            }
        }
    }
}