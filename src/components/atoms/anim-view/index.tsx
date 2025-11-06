/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import {TouchableOpacity} from 'react-native';
import * as Animatable from 'react-native-animatable';

export const AnimView = Animatable.createAnimatableComponent(Animatable.View);
export const AnimText = Animatable.createAnimatableComponent(Animatable.Text);
export const AnimImage = Animatable.createAnimatableComponent(Animatable.Image);
export const AnimButton =
  Animatable.createAnimatableComponent(TouchableOpacity);
