using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using ReactNative.UIManager.Events;
using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.Picker
{
    /// <summary>
    /// A view manager responsible for rendering picker.
    /// </summary>
    public class ReactPickerManager : BaseViewManager<ComboBox, ReactPickerShadowNode>
    { 
        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTPicker";
            }
        }

        /// <summary>
        /// Sets whether a picker is enabled.
        /// </summary>
        /// <param name="view">a combobox view.</param>
        /// <param name="enabled">
        /// Set to <code>true</code> if the picker should be enabled,
        /// otherwise, set to <code>false</code>.
        /// </param>
        [ReactProp("enabled")]
        public void SetEnabled(ComboBox view, bool enabled)
        {
            view.IsEnabled = enabled;
        }

        /// <summary>
        /// Sets the selected item.
        /// </summary>
        /// <param name="view">a combobox instance.</param>
        /// <param name="selected">The selected item.</param>
        [ReactProp("selected")]
        public void SetSelected(ComboBox view, int selected)
        {
            // Temporarily disable selection changed event handler.
            view.SelectionChanged -= OnSelectionChanged;

            view.SelectedIndex = view.Items.Count > selected ? selected : -1;

            if (view.SelectedIndex != -1)
            {
                view.Foreground = ((ComboBoxItem)(view.Items[view.SelectedIndex])).Foreground;
            }

            view.SelectionChanged += OnSelectionChanged;
        }

        /// <summary>
        /// Populates a <see cref="ComboBox"/>
        /// </summary>
        /// <param name="view">a combobox instance.</param>
        /// <param name="items">The picker items.</param>
        [ReactProp("items")]
        public void SetItems(ComboBox view, JArray items)
        {
            // Temporarily disable selection changed event handler.
            view.SelectionChanged -= OnSelectionChanged;

            for (var index = 0; index < items.Count; index++)
            {
                var label = items[index].Value<JToken>("label");
                if (label != null)
                {
                    var item = new ComboBoxItem();

                    item.Content = label.Value<string>();
                    var color = items[index].Value<JToken>("color");
                    if (color != null)
                    {
                        var rgb = color.Value<uint>();
                        item.Foreground = new SolidColorBrush(ColorHelpers.Parse(rgb));
                    } 

                    view.Items.Add(item);
                }            
            } 
              
            view.SelectionChanged += OnSelectionChanged;
        }

        /// <summary>
        /// This method should return the <see cref="ReactPickerShadowNode"/>
        /// which will be then used for measuring the position and size of the
        /// view. 
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        public override ReactPickerShadowNode CreateShadowNodeInstance()
        {
            return new ReactPickerShadowNode();
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        public override void UpdateExtraData(ComboBox root, object extraData)
        {
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ReactPickerManager"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, ComboBox view)
        {
            view.SelectionChanged -= OnSelectionChanged;
        }
  
        /// <summary>
        /// Creates a new view instance of type <see cref="ComboBox"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override ComboBox CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ComboBox();
        }

        /// <summary>
        /// Subclasses can override this method to install custom event 
        /// emitters on the given view.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, ComboBox view)
        {
            view.SelectionChanged += OnSelectionChanged;
        }

        /// <summary>
        /// Selection changed event handler.
        /// </summary>
        /// <param name="sender">an event sender.</param>
        /// <param name="e">the event.</param>
        private void OnSelectionChanged(object sender, RoutedEventArgs e)
        {
            var comboBox = (ComboBox)sender;
            var reactContext = comboBox.GetReactContext();
            reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ReactPickerEvent(
                        comboBox.GetTag(),
                        comboBox.SelectedIndex));
        }

        /// <summary>
        /// A picker specific event.
        /// </summary>
        class ReactPickerEvent : Event
        {
            private readonly int _selectedIndex;

            public ReactPickerEvent(int viewTag, int selectedIndex)
                : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
            {
                _selectedIndex = selectedIndex;
            }

            public override string EventName
            {
                get
                {
                    return "topSelect";
                }
            }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                var eventData = new JObject
                {
                    { "target", ViewTag },
                    { "position", _selectedIndex },
                };

                eventEmitter.receiveEvent(ViewTag, EventName, eventData);
            }
        }
    }
}
