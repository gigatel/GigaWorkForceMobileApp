Guide of Background Location Service

- Follow ios setup
  react-native-background-geolocation
  Add permissions, privecy info, background location update

- Android
  This service uses notifee foreground service feature

  Android Menifest

  - Required Permissions
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
  - Service Declarations
    <service android:name="app.notifee.core.ForegroundService"
        tools:replace="android:foregroundServiceType"
        android:foregroundServiceType="location" />

React Native

- Import Foreground service in index.js for load on fisrt launch
  import './src/Utils/BackgroundUpdate/Forground';
- In App.js use like below
  <BackgroundLocation />

Note: Make changes in files as per your need
