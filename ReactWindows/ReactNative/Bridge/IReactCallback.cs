using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    public interface IReactCallback
    {
        void Invoke(int moduleId, int methodId, JArray parameters);

        void OnBatchComplete();
    }
}
