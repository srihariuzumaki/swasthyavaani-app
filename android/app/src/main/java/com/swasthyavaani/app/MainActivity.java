package com.swasthyavaani.app;

import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                for (String resource : request.getResources()) {
                                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                                        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                                        return;
                                    }
                                }
                                request.deny();
                            } catch (Exception e) {
                                request.deny();
                            }
                        });
                    }
                });
            }
        }
    }
}
