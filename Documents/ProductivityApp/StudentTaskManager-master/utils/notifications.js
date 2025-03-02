import * as Notifications from 'expo-notifications';

export const scheduleTaskReminder = async (task) => {
  const trigger = new Date(task.deadline);
  trigger.setHours(9, 0, 0); // Set reminder for 9 AM on deadline day
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📅 Task Deadline Reminder',
      body: `${task.title} for ${task.course} is due today!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger,
  });
};

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};