
namespace ReactNative.UIManager
{
    using ReactNative.Bridge;

    public class ThemedReactContext : ReactContext
    {
        private readonly ReactApplicationContext mReactApplicationContext;

        public ThemedReactContext(ReactApplicationContext reactApplicationContext) {
             InitializeWithInstance(reactApplicationContext.CatalystInstance);
             mReactApplicationContext = reactApplicationContext;
        }

        public void addLifecycleEventListener(ILifecycleEventListener listener)
        {
            mReactApplicationContext.AddLifecycleEventListener(listener);
        }

        public void removeLifecycleEventListener(ILifecycleEventListener listener)
        {
            mReactApplicationContext.RemoveLifecycleEventListener(listener);
        }

    }
}
