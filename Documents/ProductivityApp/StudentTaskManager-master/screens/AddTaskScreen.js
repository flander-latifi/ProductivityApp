import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput, Menu } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DatePickerInput } from 'react-native-paper-dates';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tasks';

export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [priority, setPriority] = useState('Medium');
  const [courseMenuVisible, setCourseMenuVisible] = useState(false);
  const [priorityMenuVisible, setPriorityMenuVisible] = useState(false);

  const courseOptions = [
    { label: 'Mathematics', value: 'Mathematics' },
    { label: 'Science', value: 'Science' },
    { label: 'History', value: 'History' },
    { label: 'English', value: 'English' },
    { label: 'Geography', value: 'Geography' },
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }
    if (!course.trim()) {
      alert('Please select a course');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      course,
      deadline: deadline.toISOString().split('T')[0],
      priority,
      progress: 0,
    };

    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedTasks = storedTasks ? JSON.parse(storedTasks) : [];

      const updatedTasks = [...parsedTasks, newTask];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks));

      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Task Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { text: '#000000' } }} // Ngjyra e zezë për tekstin
      />

      <TextInput
        label="Task Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={4}
        theme={{ colors: { text: '#000000' } }} // Ngjyra e zezë për tekstin
      />

      <View style={styles.menuContainer}>
        <Menu
          visible={courseMenuVisible}
          onDismiss={() => setCourseMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCourseMenuVisible(true)}
              style={styles.input}
              icon="book"
              theme={{ colors: { text: '#000000' } }} // Ngjyra e zezë për tekstin
            >
              {course ? `Course: ${course}` : 'Select Course'}
            </Button>
          }
        >
          {courseOptions.map((option) => (
            <Menu.Item
              key={option.value}
              title={option.label}
              onPress={() => {
                setCourse(option.value);
                setCourseMenuVisible(false);
              }}
            />
          ))}
        </Menu>
      </View>

      <DatePickerInput
        label="Deadline"
        value={deadline}
        onChange={(date) => setDeadline(date)}
        style={styles.input}
        locale="en"
        mode="outlined"
        theme={{ colors: { text: '#000000' } }} // Ngjyra e zezë për tekstin
      />

      <Menu
        visible={priorityMenuVisible}
        onDismiss={() => setPriorityMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setPriorityMenuVisible(true)}
            style={styles.input}
            icon="alert-circle"
            theme={{ colors: { text: '#000000' } }} // Ngjyra e zezë për tekstin
          >
            Priority: {priority}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            setPriority('High');
            setPriorityMenuVisible(false);
          }}
          title="High"
        />
        <Menu.Item
          onPress={() => {
            setPriority('Medium');
            setPriorityMenuVisible(false);
          }}
          title="Medium"
        />
        <Menu.Item
          onPress={() => {
            setPriority('Low');
            setPriorityMenuVisible(false);
          }}
          title="Low"
        />
      </Menu>

      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        icon="content-save"
        theme={{ colors: { text: '#FFFFFF' } }} // Ngjyra e bardhë për tekstin e butonit
      >
        Save Task
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#FFFFFF', // Background i bardhë për fushat e hyrjes
  },
  button: {
    marginTop: 20,
    backgroundColor: '#6200EE', // Ngjyra e butonit
  },
  menuContainer: {
    marginBottom: 10,
  },
});