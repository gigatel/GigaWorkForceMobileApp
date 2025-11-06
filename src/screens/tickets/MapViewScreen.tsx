// screens/MapViewScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@navigation/navigator';
import {COLORS, SIZE} from '@res';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';

type MapViewRouteProp = RouteProp<RootStackParamList, 'MapViewScreen'>;
type MapViewNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MapViewScreen'
>;

const MapViewScreen: React.FC = () => {
  const route = useRoute<MapViewRouteProp>();
  const navigation = useNavigation<MapViewNavigationProp>();

  const {latitude, longitude, title} = route.params;

  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    Alert.alert(
      'Open in Google Maps',
      'Do you want to open this location in Google Maps for navigation?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Open',
          onPress: () => {
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Could not open Google Maps');
            });
          },
        },
      ],
    );
  };

  const handleGetDirections = () => {
    const url = `https://maps.google.com/?q=${latitude},${longitude}&navigate=yes`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open navigation');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.PRIMARY} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>G</Text>
          </View>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.networkIndicator} />
        </View>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}>
        <Marker
          coordinate={{latitude, longitude}}
          title={title}
          description={`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(
            6,
          )}`}
        />
      </MapView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>{title}</Text>
          <Text style={styles.coordinates}>
            📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={handleGetDirections}>
            <Text style={styles.buttonText}>🧭 Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapsButton}
            onPress={handleOpenInGoogleMaps}>
            <Text style={styles.buttonText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(12),
    elevation: 4,
  },
  backButton: {
    padding: SIZE.MS(8),
  },
  backText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(20),
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SIZE.MS(28),
    height: SIZE.MS(28),
    borderRadius: SIZE.MS(14),
    backgroundColor: COLORS.WARNING,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZE.MS(8),
  },
  logoText: {
    color: COLORS.TEXT_DARKER,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
  },
  headerRight: {
    width: SIZE.MS(32),
    alignItems: 'flex-end',
  },
  networkIndicator: {
    width: SIZE.MS(8),
    height: SIZE.MS(8),
    borderRadius: SIZE.MS(4),
    backgroundColor: COLORS.SUCCESS,
  },
  map: {
    flex: 1,
  },
  bottomContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SIZE.MS(16),
    paddingVertical: SIZE.MVS(16),
    elevation: 4,
  },
  locationInfo: {
    marginBottom: SIZE.MVS(16),
  },
  locationTitle: {
    fontSize: SIZE.MS(18),
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SIZE.MVS(4),
  },
  coordinates: {
    fontSize: SIZE.MS(14),
    color: COLORS.TEXT_MEDIUM,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SIZE.MS(12),
  },
  directionsButton: {
    flex: 1,
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  mapsButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SIZE.MVS(12),
    borderRadius: SIZE.MS(6),
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: SIZE.MS(14),
    fontWeight: 'bold',
  },
});

export default MapViewScreen;
