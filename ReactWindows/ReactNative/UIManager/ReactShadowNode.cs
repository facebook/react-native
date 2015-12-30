using ReactNative.CSSLayout;
using System.Collections.Generic;
using System;
using ReactNative.UIManager.Events;

namespace ReactNative.UIManager
{
    public class ReactShadowNode : CSSNode
    {
        private bool _nodeUpdated = true;

        private float _AbsoluteLeft;
        private float _AbsoluteTop;
        private float _AbsoluteRight;
        private float _AbsoluteBottom;
        private bool _ShouldNotifyOnLayout;

        private List<ReactShadowNode> mNativeChildren;

        public int ReactTag
        {
            get;
            set;
        }

        public ReactShadowNode Parent
        {
            get;
            set;
        }

        public string ViewClassName
        {
            get;
            set;
        }
        public int StyleWidth
        {
            get;
            set;
        }

        public int StyleHeight
        {
            get;
            set;
        }
        public ReactShadowNode RootNode
        {
            get;
            set;
        }

        public ThemedReactContext ThemedContext
        {
            get;
            set;
        }
        public bool IsVirtual { get; internal set; }

        public void UpdateProperties(CatalystStylesDiffMap styles)
        {
            throw new NotImplementedException();
        }

        internal IList<ReactShadowNode> Children
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public bool IsVirtualAnchor { get; internal set; }
        public bool IsLayoutOnly { get; internal set; }
        public bool HasUpdates { get; internal set; }
        public double LayoutX { get; internal set; }
        public double LayoutY { get; internal set; }
        public bool ShouldNotifyOnLayout { get; internal set; }
        public int ScreenX { get; internal set; }
        public int ScreenWidth { get; internal set; }
        public int ScreenHeight { get; internal set; }
        public int ScreenY { get; internal set; }

        internal int IndexOf(ReactShadowNode oldNode)
        {
            throw new NotImplementedException();
        }

        internal void CalculateLayout(CSSLayoutContext _layoutContext)
        {
            throw new NotImplementedException();
        }

        internal void OnBeforeLayout()
        {
            throw new NotImplementedException();
        }

        internal void DispatchUpdates(double absoluteX, double absoluteY, EventDispatcher eventDispatcher, NativeViewHierarchyOptimizer _nativeViewHierarchyOptimizer)
        {
            throw new NotImplementedException();
        }

        internal void MarkUpdateSeen()
        {
            _nodeUpdated = true;
        }
    }
}
