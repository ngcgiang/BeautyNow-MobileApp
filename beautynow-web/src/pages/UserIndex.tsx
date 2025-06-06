import React from 'react';
import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

export default function UserIndex() {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Customer site</Text>
      <div style={{ margin: '30px 0', height: 1, width: '80%', background: '#eee' }} />
      <EditScreenInfo path="src/pages/UserIndex.tsx" />
      <button
        style={{
          backgroundColor: '#ff4747',
          padding: '12px 30px',
          borderRadius: 8,
          marginTop: 20,
          color: 'white',
          fontWeight: 'bold',
          fontSize: 16,
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => alert('Logout')}
      >
        Logout
      </button>
    </View>
  );
} 