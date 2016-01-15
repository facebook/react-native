
namespace ReactNative.UIManager
{
    using ReactNative.Bridge;

    public class ThemedReactContext : ReactContext
    {
        private readonly ReactContext mReactContext;

        public ThemedReactContext(ReactContext reactApplicationContext) {
             InitializeWithInstance(reactApplicationContext.CatalystInstance);
             mReactContext = reactApplicationContext;
        }

        public void addLifecycleEventListener(ILifecycleEventListener listener)
        {
            mReactContext.AddLifecycleEventListener(listener);
        }

        public void removeLifecycleEventListener(ILifecycleEventListener listener)
        {
            mReactContext.RemoveLifecycleEventListener(listener);
        }

    }
}
