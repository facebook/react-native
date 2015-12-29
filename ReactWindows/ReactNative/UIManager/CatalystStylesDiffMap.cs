using Newtonsoft.Json.Linq;

namespace ReactNative.UIManager
{
    public class CatalystStylesDiffMap
    {
        private JObject properties;

        public CatalystStylesDiffMap(JObject properties)
        {
            this.properties = properties;
        }
    }
}