import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';

const AboutPage = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💪 Gym App</Text>
        <Text style={styles.version}>Versiyon 1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uygulama Hakkında</Text>
        <Text style={styles.cardText}>
          Gym App, kullanıcıların antrenman programlarını takip etmelerine,
          beslenme planları oluşturmalarına ve yapay zeka destekli sağlık
          asistanından yararlanmalarına olanak tanıyan kapsamlı bir mobil
          fitness uygulamasıdır.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Özellikler</Text>
        <Text style={styles.cardText}>🏋️ Kişiselleştirilmiş antrenman programları</Text>
        <Text style={styles.cardText}>🥗 AI destekli beslenme planları</Text>
        <Text style={styles.cardText}>👣 Adım sayar ve su takibi</Text>
        <Text style={styles.cardText}>🏆 XP ve rozet sistemi</Text>
        <Text style={styles.cardText}>🌙 Açık / Koyu tema desteği</Text>
        <Text style={styles.cardText}>🌍 Türkçe ve İngilizce dil desteği</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Teknolojiler</Text>
        <Text style={styles.cardText}>📱 React Native & Expo</Text>
        <Text style={styles.cardText}>🖥️ Node.js & Express</Text>
        <Text style={styles.cardText}>🗄️ PostgreSQL & Redis</Text>
        <Text style={styles.cardText}>🤖 Google Gemini AI</Text>
        <Text style={styles.cardText}>🐳 Docker & GitHub Actions</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Geliştiriciler</Text>
        <Text style={styles.cardText}>👨‍💻 Enes Aydın</Text>
        <Text style={styles.cardText}>👨‍💻 İdris Aydın</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lisans</Text>
        <Text style={styles.cardText}>MIT License © 2025</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  version: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    lineHeight: 22,
  },
});

export default AboutPage;