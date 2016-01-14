using ReactNative.Bridge;
using System;
using System.Collections.Generic;

namespace ReactNative.Modules.Toast
{
    enum Durations : int { @short, @long }

    public sealed class ToastModule : ReactContextNativeModuleBase
    {
        const string DURATION_SHORT_KEY = "SHORT";
        const string DURATION_LONG_KEY = "LONG";

        public ToastModule(ReactContext reactContext)
            : base(reactContext)
        { }

        public override string Name
        {
            get
            {
                return "ToastModule";
            }
        }

        public override IReadOnlyDictionary<string, object> Constants
        {
            get
            {
                return new Dictionary<string, object>
                {
                  { DURATION_SHORT_KEY, DURATION_SHORT_KEY },
                  { DURATION_LONG_KEY, DURATION_LONG_KEY },
                };
            }
        }

        [ReactMethod]
        public void show(string message, int duration)
        {
            if (Enum.IsDefined(typeof(Durations), duration))
            {
                var durationToUse = (Durations)duration;
                ToastHelper.SendToast(message, durationToUse.ToString());
            }
            else
            {
                throw new ArgumentException("invalid duration for Toast", "duration");
            }
        }
    }
}
