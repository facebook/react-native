using ReactNative.Bridge;

namespace ReactNative.UIManager
{
    public class ThemedReactContext : ReactContext
    {
        private readonly ReactContext _reactContext;

        public ThemedReactContext(ReactContext reactApplicationContext)
        {
             InitializeWithInstance(reactApplicationContext.ReactInstance);
             _reactContext = reactApplicationContext;
        }

        public override void AddLifecycleEventListener(ILifecycleEventListener listener)
        {
            _reactContext.AddLifecycleEventListener(listener);
        }

        public override void RemoveLifecycleEventListener(ILifecycleEventListener listener)
        {
            _reactContext.RemoveLifecycleEventListener(listener);
        }
    }
}
