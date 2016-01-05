using ReactNative.Bridge;
using System;

namespace ReactNative.Modules.WebSocket
{
    class WebSocketModule : ReactContextNativeModuleBase
    {
        public WebSocketModule(ReactApplicationContext reactContext)
            : base(reactContext)
        {
        }

        public override string Name
        {
            get
            {
                return "WebSocketModule";
            }
        }

        [ReactMethod]
        public void connect(string url, int id)
        {
            throw new NotImplementedException();
        }

        [ReactMethod]
        public void close(int code, string reason, int id)
        {
            throw new NotImplementedException();
        }

        [ReactMethod]
        public void send(string message, int id)
        {
            throw new NotImplementedException();
        }
    }
}
