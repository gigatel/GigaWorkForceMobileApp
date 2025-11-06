# ---------------------------
# Project-wide ProGuard / R8 rules (React Native + OTP Retriever)
# ---------------------------

# Keep useful attributes for reflection/JSON
-keepattributes *Annotation*,EnclosingMethod,InnerClasses,Signature

# ---------------------------
# React Native core (safe keeps; most are light)
# ---------------------------
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }
# TurboModules / Fabric (future-proofing)
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.react.fabric.** { *; }

# ---------------------------
# SMS Retriever / OTP (Google Play Services + react-native-otp-verify)
# ---------------------------
# Google Play Services (SMS Retriever lives under gms.auth.api.phone)
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Some OEMs ship slightly different proguard maps; these are harmless
-keep class com.google.android.gms.auth.api.phone.** { *; }

# react-native-otp-verify packages (cover common/forked namespaces)
-keep class com.reactnativeotpverify.** { *; }
-keep class com.faizal.** { *; }            # seen in some forks
-keep class com.**.otp** { *; }             # broad safety net for otp listeners

# ---------------------------
# Networking / JSON (OkHttp/Okio/Retrofit/Gson) — common in RN stacks
# ---------------------------
# If you use fetch/axios (OkHttp under the hood via native modules)
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**
-dontwarn javax.annotation.**

# Retrofit (if present; safe even if not)
-keep class retrofit2.** { *; }
-dontwarn retrofit2.**

# Gson (avoid stripping model/type adapters)
-keep class com.google.gson.** { *; }
-keep class * extends com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * extends com.google.gson.JsonSerializer
-keep class * extends com.google.gson.JsonDeserializer

# ---------------------------
# AndroidX / Support library warnings we can safely ignore
# ---------------------------
-dontwarn org.codehaus.mojo.animal_sniffer.**
-dontwarn org.conscrypt.**
-dontwarn com.google.errorprone.annotations.**
-dontwarn com.google.j2objc.annotations.**
-dontwarn sun.misc.Unsafe

# ---------------------------
# Optional: if you see missing resource keepers for vector drawables, uncomment:
# -keep class androidx.appcompat.graphics.drawable.** { *; }
# -keep class androidx.vectordrawable.** { *; }

# ---------------------------
# Logging / no-op at runtime (you can strip logging if you want)
# ---------------------------
#-assumenosideeffects class android.util.Log { *; }
# ✅ Keep Google SMS Retriever + Consent
-keep class com.google.android.gms.auth.api.phone.** { *; }
-keep class com.google.android.gms.tasks.** { *; }

# (Optional) if your otp-verify lib uses these pkgs—safe to add:
-keep class com.reactnativeotpverify.** { *; }
-keep class in.galaxyofandroid.** { *; }

