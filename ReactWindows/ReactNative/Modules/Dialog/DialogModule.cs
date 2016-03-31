using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Collections;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;
using Windows.UI.Popups;

namespace ReactNative.Modules.Dialog
{
    class DialogModule : ReactContextNativeModuleBase, ILifecycleEventListener
    {
        private const string ActionButtonClicked = "buttonClicked";
        private const string ActionDismissed = "dismissed";

        private const string KeyButtonPositive = "buttonPositive";
        private const string KeyButtonNegative = "buttonNegative";

        private const int KeyButtonPositiveValue = 0;
        private const int KeyButtonNegativeValue = 1;

        private MessageDialog _pendingDialog;
        private bool _isInForeground;

        public DialogModule(ReactContext reactContext)
            : base(reactContext)
        {
        }

        public override string Name
        {
            get
            {
                return "DialogManagerWindows";
            }
        }

        public override IReadOnlyDictionary<string, object> Constants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { ActionButtonClicked, ActionButtonClicked },
                    { ActionDismissed, ActionDismissed },
                    { KeyButtonPositive, KeyButtonPositiveValue },
                    { KeyButtonNegative, KeyButtonNegativeValue },
                };
            }
        }

        public override void Initialize()
        {
            Context.AddLifecycleEventListener(this);
        }

        public void OnSuspend()
        {
            _isInForeground = false;   
        }

        public async void OnResume()
        {
            _isInForeground = true;

            var pendingDialog = _pendingDialog;
            _pendingDialog = null;
            if (pendingDialog != null)
            {
                await pendingDialog.ShowAsync();
            }
        }

        public void OnDestroy()
        {
        }

        [ReactMethod]
        public void showAlert(
            JObject config,
            ICallback errorCallback,
            ICallback actionCallback)
        {
            var message = config.Value<string>("message") ?? "";
            var messageDialog = new MessageDialog(message)
            {
                Title = config.Value<string>("title"),
            };

            if (config.ContainsKey(KeyButtonPositive))
            {
                messageDialog.Commands.Add(new UICommand
                {
                    Label = config.Value<string>(KeyButtonPositive),
                    Id = KeyButtonPositiveValue,
                    Invoked = target => OnInvoked(target, actionCallback),
                });
            }

            if (config.ContainsKey(KeyButtonNegative))
            {
                messageDialog.Commands.Add(new UICommand
                {
                    Label = config.Value<string>(KeyButtonNegative),
                    Id = KeyButtonNegativeValue,
                    Invoked = target => OnInvoked(target, actionCallback),
                });
            }

            RunOnDispatcher(async () =>
            {
                if (_isInForeground)
                {
                    await messageDialog.ShowAsync();
                }
                else
                {
                    _pendingDialog = messageDialog;
                }
            });
        }

        private void OnInvoked(IUICommand target, ICallback callback)
        {
            callback.Invoke(ActionButtonClicked, target.Id);
        }

        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }
    }
}