import React,{useState, useEffect} from 'react';
import { StyleSheet, Text, View, FlatList,TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const[course, setCourse] = useState([]);
  const[selectedCourse, setSelectedCourse] = useState(null);
  const[loading, setLoading] = useState(true);
    
  //Integração com API//
useEffect(() => {
  fetchCourses();
}, []);

const fetchCourses = async () => {
  try {

// Substituir pela URL da API que deseja consumir

    setTimeout(() => {
      const data = [
        { id: '1', nome: 'Análise e Desenvolvimento de Sistemas', carga horária: 200 },
        { id: '2', nome: 'Gastronomia', carga horária: 150 },
        { id: '3', nome: 'Administração', carga horária: 180 },
      ];

      setCourse(data);
      setSelectedCourse(data[0]); //Seleciona por padrão o primeiro curso//
      setLoading(false);
    }, 2000); // Simula um atraso de 2 segundos para carregar os dados
  }catch (error) {
    console.error('Erro ao buscar os cursos:', error);
  }
};
    //Lógica de seleção//
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  }

  // Aqui você dispararia atualizações de Dashboard e Certificados
    console.log(`Sistema atualizado para o curso: ${course.title}`);
  };

  const renderCourseItem = ({ item }) => {
    const isSelected = selectedCourse?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]} 
        onPress={() => handleSelectCourse(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.courseTitle, isSelected && styles.selectedText]}>
          {item.title}
        </Text>
        {isSelected && <Text style={styles.badge}>Ativo</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Carregando seus cursos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Dashboard Header Dinâmico */}
      <View style={styles.header}>
        <Text style={styles.label}>Curso Selecionado:</Text>
        <Text style={styles.activeTitle}>{selectedCourse?.title}</Text>
        <Text style={styles.progressText}>Progresso: {selectedCourse?.progress}</Text>
      </View>

      <Text style={styles.sectionTitle}>Seus Cursos</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 20,
    margin: 15,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  label: { fontSize: 12, color: '#888', marginBottom: 5 },
  activeTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  progressText: { fontSize: 14, color: '#007AFF', marginTop: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 20, marginBottom: 10 },
  list: { paddingHorizontal: 15 },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  selectedCard: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF5FF',
  },
  courseTitle: { fontSize: 15, color: '#444', flex: 1 },
  selectedText: { fontWeight: 'bold', color: '#007AFF' },
  badge: {
    backgroundColor: '#007AFF',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 10,
    overflow: 'hidden',
  }
});
