import { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@study_sessions';

export default function AnalyticsScreen() {
  const [sessions, setSessions] = useState([]);
  const [studyTime, setStudyTime] = useState(0);
  const [isStudying, setIsStudying] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    let interval;
    if (isStudying) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStudying]);

  const loadSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        setStudyTime(parsed.reduce((acc, curr) => acc + curr.duration, 0));
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  };

  const saveSession = async () => {
    const newSession = {
      date: new Date().toISOString(),
      duration: timer,
    };
    try {
      const updated = [...sessions, newSession];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSessions(updated);
      setStudyTime(prev => prev + timer);
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };

  const handleTimerControl = () => {
    if (isStudying) {
      saveSession();
      setTimer(0);
    }
    setIsStudying(!isStudying);
  };

  const getCourseDistribution = () => {
    return [
      { name: 'Math', hours: 12, color: '#FF6384' },
      { name: 'Science', hours: 8, color: '#36A2EB' },
      { name: 'History', hours: 6, color: '#FFCE56' }
    ];
  };

  const chartData = getCourseDistribution();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.centerText}>
            Study Timer
          </Text>
          <Text variant="displayMedium" style={styles.timer}>
            {Math.floor(timer / 3600).toString().padStart(2, '0')}:
            {Math.floor((timer % 3600) / 60).toString().padStart(2, '0')}:
            {(timer % 60).toString().padStart(2, '0')}
          </Text>
          <IconButton
            icon={isStudying ? 'stop' : 'play'}
            mode="contained"
            size={40}
            onPress={handleTimerControl}
            style={styles.timerButton}
            color={isStudying ? '#ff4444' : '#4CAF50'}
          />
        </Card.Content>
      </Card>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.centerText}>
            Study Statistics
          </Text>
          <Text variant="bodyLarge">Total Study Time: {(studyTime / 3600).toFixed(1)}h</Text>
          <Text variant="bodyLarge">Average Daily: {(studyTime / (sessions.length || 1) / 3600).toFixed(1)}h</Text>
          <PieChart
            data={chartData}
            width={300}
            height={150}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="hours"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  card: {
    margin: 10,
    padding: 10,
  },
  timer: {
    textAlign: 'center',
    marginVertical: 15,
  },
  timerButton: {
    alignSelf: 'center',
    margin: 10,
  },
  centerText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 15,
  },
});