using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Modules.StatusBar;
using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Storage;
using Windows.UI;

namespace ReactNative.Tests.Modules.StatusBar
{
    [TestClass]
    public class StatusBarModuleTests
    {
        [TestMethod]
        public void StatusBar_setColor()
        {
            var waitHandle = new AutoResetEvent(false);
            var statusBar = new MockStatusBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusBar);

            var color = 0xabcdefed;
            module.setColor(color);

            waitHandle.WaitOne();

            var b = (byte)color;
            color >>= 8;
            var g = (byte)color;
            color >>= 8;
            var r = (byte)color;

            Assert.AreEqual(r, statusBar.BackgroundColor.Value.R);
            Assert.AreEqual(g, statusBar.BackgroundColor.Value.G);
            Assert.AreEqual(b, statusBar.BackgroundColor.Value.B);

            module = CreateStatusBarModule(StatusBarModule.PlatformType.Desktop, statusBar);

            color = 0xabcabcab;

            module.setColor(color);
            waitHandle.WaitOne();

            b = (byte)color;
            color >>= 8;
            g = (byte)color;
            color >>= 8;
            r = (byte)color;

            Assert.AreEqual(r, statusBar.BackgroundColor.Value.R);
            Assert.AreEqual(g, statusBar.BackgroundColor.Value.G);
            Assert.AreEqual(b, statusBar.BackgroundColor.Value.B);
        }

        [TestMethod]
        public void StatusBar_setHidden()
        {
            var waitHandle = new AutoResetEvent(false);
            var statusBar = new MockStatusBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusBar);

            module.setHidden(true);
            waitHandle.WaitOne();

            Assert.AreEqual(statusBar.Hidden, true);

            module.setHidden(false);
            waitHandle.WaitOne();

            Assert.AreEqual(statusBar.Hidden, false);
        }

        [TestMethod]
        public void StatusBar_setTranslucent()
        {
            var waitHandle = new AutoResetEvent(false);
            var statusBar = new MockStatusBar(waitHandle);
            var module = CreateStatusBarModule(StatusBarModule.PlatformType.Mobile, statusBar);

            module.setTranslucent(false);
            waitHandle.WaitOne();

            Assert.AreEqual(statusBar.BackgroundOpacity, 1.0);

            module.setTranslucent(true);
            waitHandle.WaitOne();

            Assert.AreEqual(statusBar.BackgroundOpacity, 0.5);
        }

        private static StatusBarModule CreateStatusBarModule(StatusBarModule.PlatformType platform, IStatusBar statusBar)
        {
            return new StatusBarModule(platform, statusBar);
        }

        class MockStatusBar : IStatusBar
        {
            private AutoResetEvent _waitHandle;

            private bool _hidden = true;
            private Color? _backgroundColor = Colors.Black;
            private double _backgroundOpacity = 0.7;

            public MockStatusBar(AutoResetEvent waitHandle)
            {
                _waitHandle = waitHandle;
            }

            public bool Hidden
            {
                get
                {
                    return _hidden;
                }
            }

            public double BackgroundOpacity
            {
                get
                {
                    return _backgroundOpacity;
                }
                set
                {
                    _backgroundOpacity = value;
                    _waitHandle.Set();
                }
            }

            public Color? BackgroundColor
            {
                get
                {
                    return _backgroundColor;
                }
                set
                {
                    _backgroundColor = value;
                    _waitHandle.Set();
                }
            }

            public IAsyncAction HideAsync()
            {
                _hidden = true;
                _waitHandle.Set();

                Func<Task> action = async () =>  { await DummyTask(); };

                return action().AsAsyncAction();

            }

            public IAsyncAction ShowAsync()
            {
                _hidden = false;
                _waitHandle.Set();

                Func<Task> action = async () => { await DummyTask();  };

                return action().AsAsyncAction();
            }

            private static async Task DummyTask()
            {
                try
                {
                    StorageFolder storageFolder = ApplicationData.Current.LocalFolder;
                    StorageFile file = await storageFolder.CreateFileAsync("DummyTestFile", CreationCollisionOption.ReplaceExisting);
                    await file.DeleteAsync();
                }
                catch (Exception) { }
            }
        }
    }
}
