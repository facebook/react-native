using ReactNative.Views.View;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Common base class for most of the <see cref="ViewManager"/>s. 
    /// It provides support for most common properties through extending <see cref="BaseViewManager"/>.
    /// </summary>
    public abstract class SimpleViewManager : BaseViewManager
    {
        /// <summary>
        /// Creates a <see cref="LayoutShadowNode"/> instance.
        /// </summary>
        /// <returns></returns>
        public override ReactShadowNode CreateShadowNodeInstance()
        {
            return new LayoutShadowNode();
        }

        public override Type ShadowNodeType
        {
            get
            {
                return typeof(LayoutShadowNode);
            }
        }
    }
}
