using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    class Callback : ICallback
    {
        private static readonly object[] s_empty = new object[0];

        private readonly int _id;
        private readonly ICatalystInstance _instance;

        public Callback(int id, ICatalystInstance instance)
        {
            _id = id;
            _instance = instance;
        }

        public void Invoke(params object[] arguments)
        {
            _instance.InvokeCallback(_id, JArray.FromObject(arguments ?? s_empty));
        }
    }
}
