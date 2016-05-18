using ReactNative.UIManager.Events;
using System.Collections.Generic;
using Windows.Graphics.Display;
using Windows.UI.ViewManagement;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Map = System.Collections.Generic.Dictionary<string, object>;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Native module to allow JavaScript to create and update native views.
    /// </summary>
    public partial class UIManagerModule
    {
        private const string CUSTOM_BUBBLING_EVENT_TYPES_KEY = "customBubblingEventTypes";
        private const string CUSTOM_DIRECT_EVENT_TYPES_KEY = "customDirectEventTypes";

        private const string ACTION_DISMISSED = "dismissed";
        private const string ACTION_ITEM_SELECTED = "itemSelected";

        /// <summary>
        /// Create the declared constants for the module.
        /// </summary>
        /// <param name="viewManagers">
        /// The view managers exported by the module.
        /// </param>
        /// <returns>The constants map.</returns>
        public static Dictionary<string, object> CreateConstants(IReadOnlyList<IViewManager> viewManagers)
        {
            var constants = GetConstants();
            var bubblingEventTypesConstants = GetBubblingEventTypeConstants();
            var directEventTypesConstants = GetDirectEventTypeConstants();

            foreach (var viewManager in viewManagers)
            {
                var viewManagerBubblingEvents = viewManager.ExportedCustomBubblingEventTypeConstants;
                if (viewManagerBubblingEvents != null)
                {
                    RecursiveMerge(bubblingEventTypesConstants, viewManagerBubblingEvents);
                }

                var viewManagerDirectEvents = viewManager.ExportedCustomDirectEventTypeConstants;
                if (viewManagerDirectEvents != null)
                {
                    RecursiveMerge(directEventTypesConstants, viewManagerDirectEvents);
                }

                var viewManagerConstants = new Dictionary<string, object>();
                var customViewConstants = viewManager.ExportedViewConstants;
                if (customViewConstants != null)
                {
                    viewManagerConstants.Add("Constants", customViewConstants);
                }

                var viewManagerCommands = viewManager.CommandsMap;
                if (viewManagerCommands != null)
                {
                    viewManagerConstants.Add("Commands", viewManagerCommands);
                }

                var viewManagerNativeProps = viewManager.NativeProperties;
                if (viewManagerNativeProps != null && viewManagerNativeProps.Count > 0)
                {
                    viewManagerConstants.Add("NativeProps", viewManagerNativeProps);
                }

                if (viewManagerConstants.Count > 0)
                {
                    constants.Add(viewManager.Name, viewManagerConstants);
                }
            }

            constants.Add(CUSTOM_BUBBLING_EVENT_TYPES_KEY, bubblingEventTypesConstants);
            constants.Add(CUSTOM_DIRECT_EVENT_TYPES_KEY, directEventTypesConstants);
            return constants;
        }

        private static IDictionary<string, object> GetBubblingEventTypeConstants()
        {
            return new Map
            {
                {
                    "topChange",
                    new Map
                    {
                        {
                            "phasedRegistrationNames",
                            new Map
                            {
                                { "bubbled", "onChange" },
                                { "captured", "onChangeCapture" },
                            }
                        }
                    }
                },
                {
                    "topSelect",
                    new Map
                    {
                        {
                            "phasedRegistrationNames",
                            new Map
                            {
                                { "bubbled", "onSelect" },
                                { "captured", "onSelectCapture" },
                            }
                        }
                    }
                },
                {
                    TouchEventType.Start.GetJavaScriptEventName(),
                    new Map
                    {
                        {
                            "phasedRegistrationNames",
                            new Map
                            {
                                { "bubbled", "onTouchStart" },
                                { "captured", "onTouchStartCapture" },
                            }
                        }
                    }
                },
                {
                    TouchEventType.Move.GetJavaScriptEventName(),
                    new Map
                    {
                        {
                            "phasedRegistrationNames",
                            new Map
                            {
                                { "bubbled", "onTouchMove" },
                                { "captured", "onTouchMoveCapture" },
                            }
                        }
                    }
                },
                {
                    TouchEventType.End.GetJavaScriptEventName(),
                    new Map
                    {
                        {
                            "phasedRegistrationNames",
                            new Map
                            {
                                { "bubbled", "onTouchEnd" },
                                { "captured", "onTouchEndCapture" },
                            }
                        }
                    }
                },
            };
        }

        private static Dictionary<string, object> GetDirectEventTypeConstants()
        {
            return new Map
            {
                {
                    "topSelectionChange",
                    new Map
                    {
                        { "registrationName", "onSelectionChange" },
                    }
                },
                {
                    "topLoadingStart",
                    new Map
                    {
                        { "registrationName", "onLoadingStart" },
                    }
                },
                {
                    "topLoadingFinish",
                    new Map
                    {
                        { "registrationName", "onLoadingFinish" },
                    }
                },
                {
                    "topLoadingError",
                    new Map
                    {
                        { "registrationName", "onLoadingError" },
                    }
                },
                {
                    "topLayout",
                    new Map
                    {
                        { "registrationName", "onLayout" },
                    }
                },
            };
        }

        private static Dictionary<string, object> GetConstants()
        {
            var bounds = ApplicationView.GetForCurrentView().VisibleBounds;
            var scale = DisplayInformation.GetForCurrentView().RawPixelsPerViewPixel;

            return new Map
            {
                {
                    "UIView",
                    new Map
                    {
                        {
                            "ContentMode",
                            new Map
                            {
                                /* TODO: declare content mode properties */
                            }
                        },
                    }
                },
                {
                    "UIText",
                    new Map
                    {
                        {
                            "AutocapitalizationType",
                            new Map
                            {
                                /* TODO: declare capitalization types */
                            }   
                        },
                    }
                },
                {
                    "Dimensions",
                    new Map
                    {
                        {
                            "window",
                            new Dictionary<string, object>
                            {
                                { "width", bounds.Width },
                                { "height", bounds.Height },
                                { "scale", scale },
                                /* TODO: density and DPI needed? */
                            }
                        },
                    }
                },
                {
                    "StyleConstants",
                    new Map
                    {
                        {
                            "PointerEventsValues",
                            new Map
                            {
                                { "none", PointerEvents.None.ToString() },
                                { "boxNone", PointerEvents.BoxNone.ToString() },
                                { "boxOnly", PointerEvents.BoxOnly.ToString() },
                                { "unspecified", PointerEvents.Auto.ToString() },
                            }
                        },
                    }
                },
                {
                    "PopupMenu",
                    new Map
                    {
                        { ACTION_DISMISSED, ACTION_DISMISSED },
                        { ACTION_ITEM_SELECTED, ACTION_ITEM_SELECTED },
                    }
                },
                {
                    "AccessibilityEventTypes",
                    new Map
                    {
                        /* TODO: declare accessibility event types */
                    }
                },
            };
        }

        private static void RecursiveMerge(IDictionary<string, object> sink, IReadOnlyDictionary<string, object> source)
        {
            foreach (var pair in source)
            {
                var existing = default(object);
                if (sink.TryGetValue(pair.Key, out existing))
                {
                    var sourceAsMap = pair.Value as IReadOnlyDictionary<string, object>;
                    var sinkAsMap = existing as IDictionary<string, object>;
                    if (sourceAsMap != null && sinkAsMap != null)
                    {
                        RecursiveMerge(sinkAsMap, sourceAsMap);
                    }
                    else
                    {
                        // TODO: confirm that exports should be allowed to override.
                        sink[pair.Key] = pair.Value;
                    }
                }
                else
                {
                    sink.Add(pair.Key, pair.Value);
                }
            }
        }
    }
}
