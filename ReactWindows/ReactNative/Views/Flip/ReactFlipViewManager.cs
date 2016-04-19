using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Flip
{
    class ReactFlipViewManager : ViewParentManager<FlipView>
    {
        private const int SetPage = 1;

        public override string Name
        {
            get
            {
                return "WindowsFlipView";
            }
        }

        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "setPage", SetPage },
                };
            }
        }

        public override IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    {
                        "topSelectionChange",
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onSelectionChange" },
                        }
                    },
                };
            }
        }

        [ReactProp("alwaysAnimate", DefaultBoolean = true)]
        public void SetAlwaysAnimate(FlipView view, bool alwaysAnimate)
        {
            view.UseTouchAnimationsForAllNavigation = alwaysAnimate;
        }

        public override void AddView(FlipView parent, FrameworkElement child, int index)
        {
            parent.Items.Insert(index, child);
        }

        public override FrameworkElement GetChildAt(FlipView parent, int index)
        {
            return (FrameworkElement)parent.Items[index];
        }

        public override int GetChildCount(FlipView parent)
        {
            return parent.Items.Count;
        }

        public override void RemoveAllChildren(FlipView parent)
        {
            parent.Items.Clear();
        }

        public override void RemoveChildAt(FlipView parent, int index)
        {
            parent.Items.RemoveAt(index);
        }

        public override void OnDropViewInstance(ThemedReactContext reactContext, FlipView view)
        {
            view.SelectionChanged -= OnSelectionChanged;
        }

        public override void ReceiveCommand(FlipView view, int commandId, JArray args)
        {
            switch (commandId)
            {
                case SetPage:
                    view.SelectedIndex = args.First.Value<int>();
                    break;
            }
        }

        protected override FlipView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new FlipView();
        }

        protected override void AddEventEmitters(ThemedReactContext reactContext, FlipView view)
        {
            view.SelectionChanged += OnSelectionChanged;
        }

        private void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            var flipView = (FlipView)sender;
            flipView.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new SelectionChangedEvent(
                        flipView.GetTag(),
                        flipView.SelectedIndex));
        }

        class SelectionChangedEvent : Event
        {
            private readonly int _position;

            public SelectionChangedEvent(int viewTag, int position)
                : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
            {
                _position = position;
            }

            public override string EventName
            {
                get
                {
                    return "topSelectionChange";
                }
            }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                var eventData = new JObject
                {
                    { "position", _position },
                };

                eventEmitter.receiveEvent(ViewTag, EventName, eventData);
            }
        }
    }
}
