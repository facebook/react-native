using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    public interface INativeMethod
    {
        string Type { get; }

        void Invoke(ICatalystInstance catalystInstance, JArray jsArguments);
    }
}
