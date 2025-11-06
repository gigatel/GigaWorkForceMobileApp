import BackgroundLocation from './BackgroundLocation';
import {connect} from 'react-redux';
import {RootState} from '@reducers';

export interface MapStateType {
  loginToken: string | null;
  isBgAllow: boolean;
}
const mapStateToProps = (state: RootState) =>
  ({
    loginToken: state.dashboard.loginToken,
    isBgAllow: state.dashboard.isBgAllow,
  } as MapStateType);

const connector = connect(mapStateToProps);

export type ConnectorType = typeof connector;

export default connector(BackgroundLocation);
