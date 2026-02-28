/**
 * Facebook JavaScript SDK type definitions
 * Used for WhatsApp Embedded Signup integration
 */

interface FBLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    code: string;
    accessToken?: string;
    userID?: string;
  };
}

interface FBLoginParams {
  config_id: string;
  response_type: string;
  override_default_response_type: boolean;
  extras?: {
    sessionInfoVersion?: string;
    features?: Array<{ name: string }>;
    setup?: Record<string, unknown>;
  };
}

interface FBInitParams {
  appId: string;
  cookie: boolean;
  xfbml: boolean;
  version: string;
}

interface FBSDK {
  init(params: FBInitParams): void;
  login(callback: (response: FBLoginResponse) => void, params: FBLoginParams): void;
}

interface Window {
  FB: FBSDK;
  fbAsyncInit: () => void;
}
