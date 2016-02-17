using ReactNative;
using ReactNative.Modules.Core;
using ReactNative.Shell;
using System.Collections.Generic;

namespace Playground
{
    class AppReactPage : ReactPage
    {
        public override string JavaScriptBundleFile
        {
            get
            {
                return base.JavaScriptBundleFile;
                //return "ms-appx:///main.jsbundle";
            }
        }

        public override string MainComponentName
        {
            get
            {
                return "ReactRoot";
            }
        }

        public override List<IReactPackage> Packages
        {
            get
            {
                return new List<IReactPackage>
                {
                    new MainReactPackage(),
                };
            }
        }

        public override bool UseDeveloperSupport
        {
            get
            {
#if DEBUG
                return true;
#else
                return false;
#endif
            }
        }
    }
}
