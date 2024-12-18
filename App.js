import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const HomeScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());  //хранение даты
  const [workouts, setWorkouts] = useState({});     //хранение тренировок
  const [modalVisible, setModalVisible] = useState(false);  //видимость модального окна
  const [currentWorkout, setCurrentWorkout] = useState({ sport: '', duration: '', intensity: '' }); //данные текущ тренировки
  const [isEditing, setIsEditing] = useState(false);  //указывает нахождение в режиме редактирования
  const [editingIndex, setEditingIndex] = useState(null);  //индекс текущей редактируемой тренировки

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];   //преобразование даты в формат YYYY-MM-DD
  };

  const handleAddWorkout = () => {
    if (isEditing) { //если в режиме редактирования, можем поменять содержимое
      const updatedWorkouts = workouts[formatDate(selectedDate)].map((workout, index) => 
        index === editingIndex ? currentWorkout : workout
      );
      setWorkouts({ ...workouts, [formatDate(selectedDate)]: updatedWorkouts });
      setIsEditing(false);
    } else { //если новая тренировка
      const newWorkout = workouts[formatDate(selectedDate)] ? [...workouts[formatDate(selectedDate)], currentWorkout] : [currentWorkout];
      setWorkouts({ ...workouts, [formatDate(selectedDate)]: newWorkout });
    }
    resetWorkout(); //в конце сбрасываем для того, чтоб можно было вводить новые данные
  };

  const handleEditWorkout = (index) => {  //устанавливает текущее состояние тренировки
    setCurrentWorkout(workouts[formatDate(selectedDate)][index]);
    setEditingIndex(index);  //Устанавливает editingIndex и переводит интерфейс в режим редактирования, открывая модальное окно.
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleDeleteWorkout = (index) => { //обновляет список тренировок для выбранной даты, удаляя тренировку по указанному индексу

    const updatedWorkouts = workouts[formatDate(selectedDate)].filter((_, i) => i !== index); //filter используем, чтобы создать новый массив без удаленной тренировки
    setWorkouts({ ...workouts, [formatDate(selectedDate)]: updatedWorkouts });
  };

  const resetWorkout = () => {     //Сбрасывает состояние текущей тренировки и закрывает модальное окно
    setCurrentWorkout({ sport: '', duration: '', intensity: '' });
    setModalVisible(false);
  };

  const changeDate = (offset) => { //изменяет текущую дату на заданное количество дней (положительное или отрицательное значение).
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + offset)));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.selectedDate}>Выбранный день: {formatDate(selectedDate)}</Text>  
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateButton}>
          <Text style={styles.buttonText}>Предыдущий день</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={styles.dateButton}>
          <Text style={styles.buttonText}>Сегодня</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateButton}>
          <Text style={styles.buttonText}>Следующий день</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.button}>
        <Text style={styles.buttonText}>Добавить тренировку</Text>
      </TouchableOpacity>

      <FlatList
        data={workouts[formatDate(selectedDate)] || []}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.workoutItem}>
            <Text>{'Спорт: ' + item.sport + ', Длительность: ' + item.duration + ', Интенсивность: ' + item.intensity}</Text>
            <TouchableOpacity onPress={() => handleEditWorkout(index)} style={styles.editButton}>
              <Text style={styles.buttonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteWorkout(index)} style={styles.deleteButton}>
              <Text style={styles.buttonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Вид спорта"
            value={currentWorkout.sport}
            onChangeText={(text) => setCurrentWorkout({ ...currentWorkout, sport: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Длительность (в минутах)"
            value={currentWorkout.duration}
            onChangeText={(text) => setCurrentWorkout({ ...currentWorkout, duration: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Интенсивность"
            value={currentWorkout.intensity}
            onChangeText={(text) => setCurrentWorkout({ ...currentWorkout, intensity: text })}
            style={styles.input}
          />
          <TouchableOpacity onPress={handleAddWorkout} style={styles.button}>
            <Text style={styles.buttonText}>{isEditing ? 'Сохранить' : 'Добавить'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetWorkout} style={styles.button}>
            <Text style={styles.buttonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => navigation.navigate('WeeklySummary', { workouts })} style={styles.button}>
        <Text style={styles.buttonText}>Сумма занятий за неделю</Text>
      </TouchableOpacity>
    </View>
  );
};

const WeeklySummaryScreen = ({ route }) => {
  const { workouts } = route.params;

  const calculateWeeklyTotal = () => {  //калькулятор часов в неделю
    let totalHours = 0;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      
      if (workouts[formattedDate]) {
        workouts[formattedDate].forEach(workout => {
          totalHours += parseFloat(workout.duration) || 0;
        });
      }
    }
    
    return totalHours; //выводим итоговое количество часов
  };

  return (
    <View style={styles.container}>
      <Text style={styles.summaryTitle}>Суммарное время занятий за неделю:</Text>
      <Text style={styles.summaryTotal}>{calculateWeeklyTotal() + ' минут'}</Text>
    </View>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Календарь тренировок' }} />
        <Stack.Screen name="WeeklySummary" component={WeeklySummaryScreen} options={{ title: 'Итоги недели' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#d8bfd8',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#800080',
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedDate: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4b0082',
    padding: 10,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  workoutItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4b0082',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#800080',
    padding: 5,
    marginLeft: 5,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
    padding: 5,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;