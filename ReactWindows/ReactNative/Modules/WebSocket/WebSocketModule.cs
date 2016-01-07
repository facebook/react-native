using ReactNative.Bridge;

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
            // TODO: implement
        }

        [ReactMethod]
        public void close(int code, string reason, int id)
        {
            // TODO: implement
        }

        [ReactMethod]
        public void send(string message, int id)
        {
            // TODO: implement
        }
    }
}
