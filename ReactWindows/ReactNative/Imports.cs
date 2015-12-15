using Newtonsoft.Json.Linq;

namespace ReactNative
{
    public static class Imports
    {
        public static JObject Instance { get; } = JObject.Parse(
            @"{
                AppRegistry: {
                    methods: [
                        'runApplication'
                    ]
                },
                RCTDeviceEventEmitter: {
                    methods: [
                        'emit'
                    ]
                },
                RCTEventEmitter: {
                    methods: [
                        'receiveEvent'
                    ]
                },
                JSTimersExecution: {
                    methods: [
                        'callTimers'
                    ]
                }
            }");
    }
}
