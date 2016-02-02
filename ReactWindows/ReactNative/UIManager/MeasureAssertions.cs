using System;

namespace ReactNative.UIManager
{
    static class MeasureAssertions
    {
        public static void AssertExplicitMeasurement(double width, double height)
        {
            if (IsUnspecified(width) || IsUnspecified(height))
            {
                throw new InvalidOperationException("A react view must have an explicit width and height.");
            }
        }

        private static bool IsUnspecified(double value)
        {
            return double.IsInfinity(value) || double.IsNaN(value);
        }
    }
}
