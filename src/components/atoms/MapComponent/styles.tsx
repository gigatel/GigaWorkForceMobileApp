import {StyleSheet, Dimensions} from 'react-native';
import {COLORS, SIZE} from '@res';
import {Colors} from 'react-native/Libraries/NewAppScreen';

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: SIZE.MS(120),
    right: SIZE.MS(12),
    gap: 12,
  },
  precisionIcon: {
    height: SIZE.MS(46),
    width: SIZE.MS(46),
    marginTop: SIZE.MVS(42),
  },
  cameraIcon: {
    height: SIZE.MS(46),
    width: SIZE.MS(46),
    tintColor: COLORS.PRIMARY,
  },
  fab: {
    width: SIZE.MS(44),
    height: SIZE.MS(44),
    borderRadius: SIZE.MS(22),
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: SIZE.MS(4),
  },
  locToast: {
    position: 'absolute',
    bottom: SIZE.MVS(16),
    left: SIZE.MS(16),
    right: SIZE.MS(16),
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: SIZE.MS(10),
    borderRadius: SIZE.MS(8),
  },
  locationInfoContainer: {
    backgroundColor: Colors.WHITE,
    borderTopWidth: 1,
    borderColor: '#e6e6e6',
    paddingHorizontal: SIZE.MS(12),
    paddingVertical: SIZE.MVS(8),
  },
  locationInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZE.MVS(12),
  },
  mapIcon: {
    height: SIZE.MS(20),
    width: SIZE.MS(20),
    tintColor: COLORS.PRIMARY,
  },
  locationInfoTitle: {
    fontSize: SIZE.MS(16),
    fontWeight: 'bold',
    color: '#333',
  },
  locationInfoText: {
    fontSize: SIZE.MS(14),
    color: '#333',
    marginBottom: SIZE.MVS(8),
    lineHeight: SIZE.MVS(18),
    marginLeft: SIZE.MS(8),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZE.MVS(8),
  },
  mediumButton: {
    width: SIZE.MS(100),
    paddingVertical: SIZE.MVS(10),
    alignItems: 'center',
    borderRadius: SIZE.MVS(10),
  },
  btnTxt: {
    color: COLORS.WHITE,
    fontSize: SIZE.MVS(16),
    fontWeight: '500',
  },
  distanceCss: {
    paddingVertical: SIZE.MVS(6),
    paddingHorizontal: SIZE.MVS(10),
    borderRadius: SIZE.MVS(20),
    backgroundColor: COLORS.PRIMARY,
    color: COLORS.WHITE,
  },
});
