using System;
using Windows.Devices.Sensors;

namespace ReactNative.DevSupport
{
    /// <summary>
    /// A static class that manages the Shaken event for the Accelerometer.
    /// </summary>
    public class ShakeAccelerometer
    {
        private const double AccelerationThreshold = 2;
        private const int ShakenInterval = 500;

        private static ShakeAccelerometer s_instance;

        private readonly Accelerometer _instance;

        private DateTime _lastDetected = DateTime.Now;
        private bool _enabled;

        private ShakeAccelerometer(Accelerometer instance)
        {
            _instance = instance;
            _instance.ReadingChanged += OnReadingChanged;
        }

        /// <summary>
        /// Raised whenever the Accelerometer detects a shaking gesture.
        /// </summary>
        public event EventHandler Shaken;

        /// <summary>
        /// Get the default shake accelerometer.
        /// </summary>
        /// <returns>The default shake accelerometer.</returns>
        public static ShakeAccelerometer GetDefault()
        {
            if (s_instance == null)
            {
                var accelerometer = Accelerometer.GetDefault();
                if (accelerometer != null)
                {
                    s_instance = new ShakeAccelerometer(accelerometer);
                }
            }

            return s_instance;
        }

        private void OnReadingChanged(Accelerometer sender, AccelerometerReadingChangedEventArgs args)
        {
            double g = Math.Round(Square(args.Reading.AccelerationX) + Square(args.Reading.AccelerationY) + Square(args.Reading.AccelerationZ));
            if (g > AccelerationThreshold && DateTime.Now.Subtract(_lastDetected).Milliseconds > ShakenInterval)
            {
                _lastDetected = DateTime.Now;
                Shaken?.Invoke(null, EventArgs.Empty);
            }
        }

        private static double Square(double value)
        {
            return value * value;
        }
    }
}
