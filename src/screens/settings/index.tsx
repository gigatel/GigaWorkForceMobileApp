import {Screen} from '@organisms';
import {COLORS} from '@res';
import {ScreenProps} from '@types';
import React, {FC, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Common, Preferences, Voice} from '@utils';
import i18next from '../../locales/i18n';
import Tts from 'react-native-tts';
const Settings: FC<ScreenProps.Settings> = () => {
  const {t} = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    i18next.language || 'en',
  );

  useEffect(() => {
    (async () => {
      try {
        // optional: just to list voices in console
        try {
          const voices = await Tts.voices();
          console.log('TTS voices:', voices?.length || 0);
        } catch (e) {
          // ignore TTS errors; not critical
        }

        const savedLanguage = await Preferences.getData('LANGUAGE'); // ✅ await
        if (savedLanguage && savedLanguage !== i18next.language) {
          await i18next.changeLanguage(savedLanguage);
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        Common.error('Error loading language:', error);
      }
    })();
  }, []);
  const changeLanguage = async (lang: string) => {
    try {
      await Preferences.setData('LANGUAGE', lang);
      if (lang !== i18next.language) {
        await i18next.changeLanguage(lang);
      }
      setSelectedLanguage(lang);
    } catch (error) {
      Common.error('Error saving language:', error);
    }
  };
  return (
    <Screen preset="fixed" statusBgColor={COLORS.PRIMARY}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.label}>{t('settings.language')}</Text>
        <TouchableOpacity
          style={[
            styles.button,
            selectedLanguage === 'en' && styles.selectedButton,
          ]}
          onPress={() => changeLanguage('en')}>
          <Text style={styles.buttonText}>{t('settings.english')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            selectedLanguage === 'hi' && styles.selectedButton,
          ]}
          onPress={() => changeLanguage('hi')}>
          <Text style={styles.buttonText}>{t('settings.hindi')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => Voice.speak('GTPL मोबाइल ऐप में आपका स्वागत है')}>
          <Text style={styles.buttonText}>Speak</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20, backgroundColor: '#FFFFFF'},
  title: {fontSize: 24, fontWeight: 'bold', marginBottom: 20},
  label: {fontSize: 18, marginBottom: 10},
  button: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#00000030',
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedButton: {backgroundColor: '#00000020'},
  buttonText: {fontSize: 16, textAlign: 'center'},
});
