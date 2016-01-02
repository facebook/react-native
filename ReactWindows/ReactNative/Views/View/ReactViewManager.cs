using Facebook.CSSLayout;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Automation.Peers;
using Windows.UI.Xaml.Automation.Provider;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.View
{
    public class ReactViewManager : ViewGroupManager<ReactViewPanel>
    {
        public static readonly string REACT_CLASS = ViewProperties.ViewClassName;
        private static readonly int CMD_SET_PRESSED = 1;

        public override string Name
        {
            get
            {
                return REACT_CLASS;
            }
        }
        
        /// <summary>
        /// Returns the view instance for <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="reactContext"></param>
        /// <returns></returns>
        protected override ReactViewPanel CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            return new ReactViewPanel();
        }

        /// <summary>
        /// The border radius of the <see cref="ReactRootView"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="borderRadius">The border radius value.</param>
        [ReactProperty("borderRadius")]
        public void SetBorderRadius(ReactViewPanel view, float borderRadius)
        {
            view.SetBorderRadius(borderRadius);
        }

        /// <summary>
        /// Sets the elevation transformation effect of the <see cref="ReactViewPanel"/>. 
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="elevation">The 3D Z-Location index of the <see cref="ReactRootView"/>.</param>
        [ReactProperty("elevation")]
        public void SetElevation(ReactViewPanel view, float elevation)
        {
            view.SetElevationEffect(elevation);
        }

        /// <summary>
        /// Sets the border thickness of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="borderWidth">The border width in pixels.</param>
        [ReactProperty("borderWidth", DefaultFloat = float.NaN)]    
        public void SetBorderWidth(ReactViewPanel view, float borderWidth)
        {
            view.SetBorderThickness(borderWidth);
        }

        /// <summary>
        /// Set the border color of the <see cref="ReactViewPanel"/>.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="color">The color hex code.</param>
        [ReactProperty("borderColor")]
        public void SetBorderColor(ReactViewPanel view, string color)
        {
            view.SetBorderBackgroundColor(color);
        }

        /// <summary>
        /// Sets the <see cref="ReactViewPanel"/> pointer events based on a event string key.
        /// </summary>
        /// <param name="view">The view panel.</param>
        /// <param name="pointerEventsStr">The event to propogate down to the view.</param>
        [ReactProperty("pointerEvents")]
        public void SetPointerEvents(ReactViewPanel view, string pointerEventsStr)
        {
            var pointerEvent = default(PointerEvents);
            if (Enum.TryParse(pointerEventsStr, out pointerEvent))
            {
                view.PointerEvents = pointerEvent;
            }
        }

        /// <summary>
        /// The commands map for the <see cref="ReactViewManager"/>.
        /// </summary>
        public override IReadOnlyDictionary<string, object> CommandsMap {
            get
            {
                return new Dictionary<string, object>()
                {
                    { "setPressed", CMD_SET_PRESSED }
                };
            }
        }

        /// <summary>
        /// Implement this method to receive events/commands directly from
        /// JavaScript through the <see cref="UIManager"/>.
        /// </summary>
        /// <param name="root">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(FrameworkElement view, int commandId, JArray args)
        {
            if (args.Count != 1)
            {
                throw new ArgumentException("Receive commands for the ReactViewModel currently only supports the setPressed command");
            }

            if(commandId == CMD_SET_PRESSED)
            {
                var simulateViewClick = new FrameworkElementAutomationPeer(view);
                IInvokeProvider invokeProv = simulateViewClick.GetPattern(PatternInterface.Invoke) as IInvokeProvider;
                invokeProv.Invoke();
            }
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public override void AddView(Panel parent, UIElement child, int index)
        {
            parent.Children.Insert(index, child);
        }

        protected override void UpdateExtraData(ReactViewPanel root, object extraData)
        {
        }
    }
}
