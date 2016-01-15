using ReactNative.Bridge;
using System;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Native module for JavaScript timer execution.
    /// </summary>
    public class Timing : ReactContextNativeModuleBase
    {
        public Timing(ReactContext reactContext)
            : base(reactContext)
        {
        }

        public override string Name
        {
            get
            {
                return "RCTTiming";
            }
        }

        [ReactMethod]
        public void createTimer(
            int callbackId,
            int duration,
            double jsSchedulingTime,
            bool repeat)
        {
            throw new NotImplementedException();
        }

        [ReactMethod]
        public void deleteTimer(int timerId)
        {
            throw new NotImplementedException();
        }
    }
}
