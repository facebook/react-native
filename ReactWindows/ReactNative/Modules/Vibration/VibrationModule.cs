using ReactNative.Bridge;
using ReactNative.Common;
using System;
using Windows.Phone.Devices.Notification;

namespace ReactNative.Modules.Vibration
{
    /// <summary>
    /// Represents the module for vibration.  Note this is only available on Windows Mobile.
    /// </summary>
    public class VibrationModule : NativeModuleBase
    {
        private readonly bool _isMobile;

        /// <summary>
        /// Creates a new instance of the Vibration Module.
        /// </summary>
        public VibrationModule() : this(IsMobile())
        {
        }

        /// <summary>
        /// Creates a new instance of the Vibration Module with a flag of whether the platform is mobile.
        /// </summary>
        /// <param name="isMobile"></param>
        public VibrationModule(bool isMobile)
        {
            _isMobile = isMobile;
        }

        private static bool IsMobile()
        {
            return WindowsPlatformHelper.DeviceFamily == DeviceFamilyType.Mobile;
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
        /// Vibrates the device for the specified milliseconds.
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