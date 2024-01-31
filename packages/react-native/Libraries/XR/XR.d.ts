
export interface XRStatic {
  requestSession(sessionId: string): Promise<void>;
  endSession(): Promise<void>;
  supportsMultipleScenes: boolean;
}

export const XR: XRStatic;
export type XR = XRStatic;
