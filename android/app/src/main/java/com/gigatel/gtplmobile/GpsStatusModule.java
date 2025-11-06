package com.gigatrack;

import android.content.IntentFilter;
import android.content.Intent;
import android.content.Context;
import android.content.BroadcastReceiver;
import android.location.LocationManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class GpsStatusModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private BroadcastReceiver gpsReceiver;

    public GpsStatusModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        startGpsListener();
    }

    @Override
    public String getName() {
        return "GpsStatusModule";
    }

    private void sendEvent(String eventName, boolean isGpsEnabled) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, isGpsEnabled);
    }

    private void startGpsListener() {
        gpsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                LocationManager locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
                boolean gpsEnabled = false;

                try {
                    gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
                } catch (Exception e) {
                    e.printStackTrace();
                }

                sendEvent("GpsStatusChanged", gpsEnabled);
            }
        };

        IntentFilter filter = new IntentFilter(LocationManager.PROVIDERS_CHANGED_ACTION);
        filter.addAction(Intent.ACTION_PROVIDER_CHANGED); // For older devices
        ContextCompat.registerReceiver(reactContext, gpsReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED);
    }
}
