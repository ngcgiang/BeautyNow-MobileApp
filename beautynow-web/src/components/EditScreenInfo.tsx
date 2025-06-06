import React from 'react';
import { ExternalLink } from './ExternalLink';
import { MonoText } from './StyledText';
import { Text, View } from './Themed';
import Colors from '../constants/Colors';

export default function EditScreenInfo({ path }: { path: string }) {
  return (
    <View>
      <View style={{ alignItems: 'center', margin: '0 50px' }}>
        <Text style={{ fontSize: 17, lineHeight: '24px', textAlign: 'center', color: 'rgba(0,0,0,0.8)' }}>
          Open up the code for this screen:
        </Text>
        <View style={{ borderRadius: 3, padding: '0 4px', margin: '7px 0', background: 'rgba(0,0,0,0.05)' }}>
          <MonoText>{path}</MonoText>
        </View>
        <Text style={{ fontSize: 17, lineHeight: '24px', textAlign: 'center', color: 'rgba(0,0,0,0.8)' }}>
          Change any of the text, save the file, and your app will automatically update.
        </Text>
      </View>
      <View style={{ marginTop: 15, margin: '0 20px', alignItems: 'center' }}>
        <ExternalLink
          style={{ padding: '15px 0' }}
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet"
        >
          <Text style={{ color: Colors.light.tint, textAlign: 'center' }}>
            Tap here if your app doesn't automatically update after making changes
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
} 