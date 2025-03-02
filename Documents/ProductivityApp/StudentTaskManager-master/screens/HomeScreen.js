import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { FAB, Card, Text, ProgressBar, Slider, Menu, Button, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleTaskReminder, requestNotificationPermission } from '../utils/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@tasks';
const POINTS_STORAGE_KEY = '@userPoints';
const LEVELS_STORAGE_KEY = '@userLevels';

export default function HomeScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [editingDeadlineTask, setEditingDeadlineTask] = useState(null);
  const [newDeadline, setNewDeadline] = useState(new Date());
  const [progressValue, setProgressValue] = useState(0);
  const [menuVisibleTaskId, setMenuVisibleTaskId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [medals, setMedals] = useState([]);

  useEffect(() => {
    console.log('Component mounted. Loading tasks...');
    loadTasks();
    loadUserData();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (route.params?.newTask) {
      console.log('New task received:', route.params.newTask);
      setTasks(prev => {
        const updatedTasks = [...prev, route.params.newTask];
        saveTasks(updatedTasks);
        return updatedTasks;
      });
    }
  }, [route.params?.newTask]);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        setTasks(parsedTasks);
        console.log('Loaded tasks:', parsedTasks);
      }
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  };

  const loadUserData = async () => {
    try {
      const storedPoints = await AsyncStorage.getItem(POINTS_STORAGE_KEY);
      const storedLevels = await AsyncStorage.getItem(LEVELS_STORAGE_KEY);
      if (storedPoints) {
        setPoints(JSON.parse(storedPoints));
      }
      if (storedLevels) {
        setLevel(JSON.parse(storedLevels));
      }
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  };

  const saveTasks = async (tasksToSave = tasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
      console.log('Saved tasks:', tasksToSave);
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(points));
      await AsyncStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(level));
    } catch (e) {
      console.error('Failed to save user data:', e);
    }
  };

  const handleProgressChange = (taskId, newProgress) => {
    console.log('Changing progress for task', taskId, 'to', newProgress);
    setProgressValue(newProgress);
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, progress: newProgress } : task
      )
    );

    if (newProgress === 100) {
      const task = tasks.find(task => task.id === taskId);
      if (task && !task.completed) {
        const newPoints = points + 10; // 10 points for completing a task
        setPoints(newPoints);
        checkLevelUp(newPoints);
        task.completed = true;
        saveTasks();
        saveUserData();
      }
    }
  };

  const checkLevelUp = (newPoints) => {
    const newLevel = Math.floor(newPoints / 100) + 1; // Level up every 100 points
    if (newLevel > level) {
      setLevel(newLevel);
      setMedals(prevMedals => [...prevMedals, `Level ${newLevel} Medal`]);
      Alert.alert(`Level Up!`, `You've reached level ${newLevel}`);
    }
  };

  const handleDeadlineChange = (taskId, newDeadline) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, deadline: newDeadline.toISOString().split('T')[0] } : task
      )
    );
    saveTasks();
    setEditingDeadlineTask(null);
    setShowDatePicker(false);
  };

  const confirmDelete = (taskId) => {
    console.log('Confirm delete for task:', taskId);
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            console.log('User confirmed delete for task:', taskId);
            handleDelete(taskId);
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleDelete = async (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    console.log('Updated tasks after deletion:', updatedTasks);

    setTasks(updatedTasks);
    console.log('setTasks called!');

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));
    console.log('Task deleted and saved to AsyncStorage');

    const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
    console.log('Data in AsyncStorage after deletion:', JSON.parse(storedTasks));
  };

  const handleMarkAsCompleted = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: true, progress: 100 } : task
    );

    setTasks(updatedTasks);
    saveTasks(updatedTasks);

    // Rrit pikat
    const newPoints = points + 10; // 10 pikë për çdo detyrë të përfunduar
    setPoints(newPoints);
    saveUserData();

    // Kontrollo nëse përdoruesi ka arritur një nivel të ri
    checkLevelUp(newPoints);

    Alert.alert('Task Completed', 'You have earned 10 points!');
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.taskTitle}>{item.title}</Text>

          <Menu
            visible={menuVisibleTaskId === item.id}
            onDismiss={() => setMenuVisibleTaskId(null)}
            anchor={
              <Button
                icon="dots-vertical"
                onPress={() => setMenuVisibleTaskId(item.id)}
                style={styles.menuButton}
              />
            }>
            <Menu.Item
              onPress={() => {
                setEditingDeadlineTask(item);
                setNewDeadline(new Date(item.deadline));
                setShowDatePicker(true);
                setMenuVisibleTaskId(null);
              }}
              title="Edit Deadline"
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                console.log('Mark as Completed option clicked for task:', item.id);
                setMenuVisibleTaskId(null);
                handleMarkAsCompleted(item.id);
              }}
              title="Mark as Completed"
              titleStyle={{ color: 'green' }} // Ngjyra e gjelbër për të treguar përfundimin
            />
            <Divider />
            <Menu.Item
              onPress={() => {
                console.log('Delete option clicked for task:', item.id);
                setMenuVisibleTaskId(null);
                confirmDelete(item.id);
              }}
              title="Delete"
              titleStyle={{ color: 'red' }}
            />
          </Menu>
        </View>

        {item.description && (
          <Text variant="bodyMedium" style={styles.description}>
            Description: {item.description}
          </Text>
        )}

        <Text variant="bodyMedium" style={styles.taskDetail}>Course: {item.course}</Text>
        <Text variant="bodyMedium" style={styles.taskDetail}>Deadline: {item.deadline}</Text>
        <Text variant="bodyMedium" style={styles.taskDetail}>Priority: {item.priority}</Text>
        <ProgressBar
          progress={item.progress / 100}
          style={styles.progressBar}
          color={getProgressColor(item.progress)}
        />
        <Text variant="bodySmall" style={styles.progressText}>{item.progress}% Complete</Text>
      </Card.Content>

      {editingTask?.id === item.id && (
        <Card.Actions style={styles.editModal}>
          <Slider
            style={styles.slider}
            value={progressValue}
            minimumValue={0}
            maximumValue={100}
            step={5}
            onValueChange={setProgressValue}
          />
          <View style={styles.modalButtons}>
            <Button
              mode="contained"
              onPress={() => {
                console.log('Saving progress for task:', item.id, 'New progress:', progressValue);
                handleProgressChange(item.id, progressValue);
                setEditingTask(null);
              }}>
              Save {progressValue}%
            </Button>
            <Button
              mode="outlined"
              onPress={() => setEditingTask(null)}>
              Cancel
            </Button>
          </View>
        </Card.Actions>
      )}
    </Card>
  );

  const getProgressColor = (progress) => {
    if (progress >= 100) return '#4CAF50';
    if (progress >= 50) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text variant="titleMedium" style={styles.userInfoText}>Points: {points}</Text>
        <Text variant="titleMedium" style={styles.userInfoText}>Level: {level}</Text>
        <Text variant="titleMedium" style={styles.userInfoText}>Medals: {medals.join(', ')}</Text>
      </View>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddTask')}
      />

      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={newDeadline}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              setNewDeadline(selectedDate);
              handleDeadlineChange(editingDeadlineTask.id, selectedDate);
            }
          }}
        />
      )}

      {showDatePicker && Platform.OS === 'web' && (
        <input
          type="date"
          value={newDeadline.toISOString().split('T')[0]}
          onChange={(e) => {
            const selectedDate = new Date(e.target.value);
            setNewDeadline(selectedDate);
            handleDeadlineChange(editingDeadlineTask.id, selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 5,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200EE',
  },
  progressBar: {
    height: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    marginVertical: 10,
  },
  editModal: {
    flexDirection: 'column',
    padding: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  description: {
    marginBottom: 10,
    color: '#555555',
  },
  userInfo: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  userInfoText: {
    color: '#333333',
  },
  taskTitle: {
    fontWeight: 'bold',
    color: '#333333',
  },
  taskDetail: {
    color: '#555555',
  },
  progressText: {
    color: '#555555',
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
  },
});