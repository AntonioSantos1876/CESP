import { Text, View, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.text}>Clarendon Elite Cup</Text>
      <Text style={styles.sub}>Mobile app coming soon — Phase 9</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#E85D04', fontSize: 24, fontWeight: '700' },
  sub: { color: '#A0A0A0', fontSize: 14, marginTop: 8 },
})
