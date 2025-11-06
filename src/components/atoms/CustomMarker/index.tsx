import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Marker, LatLng} from 'react-native-maps';

interface CustomMarkerProps {
  coordinate: LatLng;
  title?: string;
  description?: string;
  color?: string;
  onPress?: () => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({
  coordinate,
  title,
  description,
  color = '#FF0000',
  onPress,
}) => {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}>
      <View style={[styles.marker, {backgroundColor: color}]}>
        <Text style={styles.markerText}>📍</Text>
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  marker: {
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    fontSize: 20,
  },
});

export default CustomMarker;
