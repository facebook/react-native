
export interface XRStatic {
  requestSession(sessionId: string): Promise<void>;
  endSession(): Promise<void>;

  openWindow(windowId: string): Promise<void>;
  closeWindow(windowId: string): Promise<void>;

  supportsMultipleScenes: boolean;
}

export const XR: XRStatic;
export type XR = XRStatic;
