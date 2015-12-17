using Newtonsoft.Json.Linq;
using ReactNative.Bridge;

namespace ReactNative.UIManager
{
    public class AppRegistry : JavaScriptModuleBase
    {
        void runApplication(string appKey, JObject appParameters)
        {
            Invoke(nameof(runApplication), appKey, appParameters);
        }

        void unmountApplicationComponentAtRootTag(int rootTagNode)
        {
            Invoke(nameof(unmountApplicationComponentAtRootTag), rootTagNode);
        }
    }
}
