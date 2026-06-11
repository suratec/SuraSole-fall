import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import UI from '../../../config/styles/CommonStyles';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { NavigationActions } from 'react-navigation';
import langPatientList from '../../../assets/language/auth/lang_patientList';
import {getLocalizedText} from '../../../assets/language/langUtils';

const PatientList = ({ navigation, user, token, addUser, setImpersonation, setPatientId, setPatientToken, lang, impersonating }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const titleText = getLocalizedText(lang, langPatientList.title);
    const selectPatient = getLocalizedText(lang, langPatientList.selectPatient);
    const searchPatients = getLocalizedText(lang, langPatientList.searchPatients);
    const name = getLocalizedText(lang, langPatientList.name);
    const username = getLocalizedText(lang, langPatientList.username);
    const EXIT_FLAG = 'doctor_left_on_patientlist';

    const setExitFlag   = () => AsyncStorage.setItem(EXIT_FLAG, '1');
    const clearExitFlag = () => AsyncStorage.removeItem(EXIT_FLAG);


    useEffect(() => {
        setExitFlag();          // doctor has landed on PatientList
        return () => clearExitFlag();   // leaving screen normally
    }, []);

    const patients = useMemo(
        () => (Array.isArray(user?.patients) ? user.patients : []),
        [user?.patients],
    );

    const filteredPatients = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return patients;

        return patients.filter(
            p =>
                (p.name && p.name.toLowerCase().includes(keyword)) ||
                (p.user_member && p.user_member.toLowerCase().includes(keyword)),
        );
    }, [patients, search]);

    const handleSelectPatient = useCallback((item) => {
        setSelectedId(item.id_data_role);
    }, []);

    // const handleSelectButton = async () => {
    //     const selected = patients.find(p => p.id_data_role === selectedId);
    //     if (selected) {
    //         try {
    //             // Save doctor info before switching
    //             await AsyncStorage.setItem('doctor_user', JSON.stringify(user));
    //             await AsyncStorage.setItem('doctor_token', token);
    //             setImpersonation(true);
    //             setPatientToken(data.patient_token);
    //             await AsyncStorage.setItem('patient_token', data.patient_token);
    //             console.log('Selected patient:', selected);
    //             console.log('Token:', token);
    //
    //             if (!token) {
    //                 Alert.alert('Error', 'Authentication token not found. Please log in again.');
    //                 navigation.navigate('Auth');
    //                 return;
    //             }
    //
    //             // Make API call to switch to patient
    //             const response = await fetch('https://api1.suratec.co.th/api/doctor/switch-to-patient', {
    //                 method: 'POST',
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                     'Authorization': `Bearer ${token}`
    //                 },
    //                 body: JSON.stringify({
    //                     patient_id: selected.id_data_role
    //                 })
    //             });
    //
    //             console.log('API Response status:', response.status);
    //             const data = await response.json();
    //             console.log('API Response data:', data);
    //
    //             if (data.status === 'success') {
    //                 // Create a patient object with the data from the API response
    //                 const patientData = {
    //                     id_customer: data.user_info.id_customer,
    //                     fname: data.user_info.fname,
    //                     lname: data.user_info.lname || '',
    //                     email: data.user_info.email,
    //                     role: data.member_info.data_role,
    //                     token: data.patient_token, // Use the new patient token
    //                     image: data.user_info.image,
    //                     // Add other required fields from the API response
    //                     ...data.user_info
    //                 };
    //
    //                 // Update the Redux store with the new patient data and token
    //                 addUser({ user: patientData, token: data.patient_token });
    //
    //                 // Navigate to home page
    //                 navigation.navigate('Home', { patient: patientData });
    //             } else {
    //                 console.log('API Error:', data);
    //                 Alert.alert('Error', data.message || 'Failed to switch to patient. Please try again.');
    //             }
    //         } catch (error) {
    //             console.error('Error switching to patient:', error);
    //             Alert.alert('Error', 'Failed to switch to patient. Please try again.');
    //         }
    //     }
    // };

    const handleSelectButton = async () => {
        const selected = patients.find(p => p.id_data_role === selectedId);
        if (!selected) return;

        try {
            if (!token) {
                Alert.alert('Error', 'Authentication token not found. Please log in again.');
                navigation.navigate('Auth');
                return;
            }

            // Save doctor info before switching
            await AsyncStorage.setItem('doctor_user', JSON.stringify(user));
            await AsyncStorage.setItem('doctor_token', token);
            setImpersonation(true);

            // Make API call to switch to patient
            const fetchResponse = await fetch('https://api1.suratec.co.th/api/doctor/switch-to-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    patient_id: selected.id_data_role,
                }),
            });

            const rawText = await fetchResponse.text();

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error('❌ Failed to parse JSON:', e);
                Alert.alert('Error', 'Invalid JSON response from server.');
                return;
            }

            if (data.status === 'success') {
                if (!data.patient_token || !data.user_info || !data.member_info) {
                    console.error('❌ Missing keys in API response:', data);
                    Alert.alert('Error', 'Incomplete response from server.');
                    return;
                }

                // Set patient token and ID in Redux and AsyncStorage
                setPatientToken(data.patient_token);
                await AsyncStorage.setItem('patient_token', data.patient_token);

                setPatientId(data.user_info.id_customer); // ✅ <--- ADD THIS LINE
                await AsyncStorage.setItem('patient_id', data.user_info.id_customer); // (Optional) Persist

                const patientData = {
                    id_customer: data.user_info.id_customer,
                    fname: data.user_info.fname,
                    lname: data.user_info.lname || '',
                    email: data.user_info.email,
                    role: data.member_info.data_role,
                    token: data.patient_token,
                    image: data.user_info.image,
                    security_token: data.patient_token,
                    ...data.user_info,
                };

                addUser({ user: patientData, token: data.patient_token });
                await clearExitFlag();
                navigation.navigate('Home', { patient: patientData });

            } else {
                console.log('❌ API Error:', data);
                Alert.alert('Error', data.message || 'Failed to switch to patient.');
            }
        } catch (error) {
            console.error('❌ Error switching to patient:', error);
            Alert.alert('Error', 'Network error while switching to patient.');
        }
    };

    const handleLogout = async () => {
        await clearExitFlag();
        addUser({ user: null, token: null });
        setImpersonation(false);
        navigation.navigate('Auth');
    };




    const renderPatient = useCallback(({ item }) => {
        const isSelected = selectedId === item.id_data_role;
        return (
            <TouchableOpacity
                style={[styles.patientRow, isSelected && styles.selectedRow]}
                onPress={() => handleSelectPatient(item)}
                activeOpacity={0.7}
            >
                <Text style={styles.cell}>{item.name || ''}</Text>
                <Text style={styles.cell}>{item.user_member || ''}</Text>
            </TouchableOpacity>
        );
    }, [handleSelectPatient, selectedId]);

    const keyExtractor = useCallback(item => item.id_data_role, []);

    if (!user || (!impersonating && user.role !== 'mod_employee')) {
        return null;
    }

    if (user.role === 'mod_employee' && !Array.isArray(user.patients)) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00bfc5" />
            </View>
        );
    }

    if (user.role === 'mod_employee' && patients.length === 0) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No patient data available</Text>
            </View>
        );
    }

    return (
      <View style={{flex: 1, backgroundColor: '#222'}}>
        <LinearGradient colors={UI.color_Gradient} style={styles.gradient}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.powerBtn} onPress={handleLogout}>
              <Image
                source={require('../../../assets/image/icons/logout.png')}
                style={styles.powerIcon}
              />
            </TouchableOpacity>
            <Text style={styles.title}>{titleText}</Text>
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchPatients}
                placeholderTextColor="#aaa"
                value={search}
                onChangeText={setSearch}
                underlineColorAndroid="transparent"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.listContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.headerCell}>{name}</Text>
                <Text style={styles.headerCell}>{username}</Text>
              </View>
              <FlatList
                data={filteredPatients}
                renderItem={renderPatient}
                keyExtractor={keyExtractor}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                removeClippedSubviews={true}
                keyboardShouldPersistTaps="handled"
                style={{flexGrow: 0}}
                contentContainerStyle={{paddingBottom: 8}}
              />
            </View>
            <TouchableOpacity
              style={[styles.selectButton, !selectedId && {opacity: 0.5}]}
              disabled={!selectedId}
              onPress={handleSelectButton}>
              <Text style={styles.selectButtonText}>{selectPatient}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222'
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
        padding: 20
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center'
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: 340,
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 30,
        marginBottom: 30,
    },
    powerBtn: {
        position: 'absolute',
        top: 18,
        right: 18,
        zIndex: 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        elevation: 2,
    },
    powerIcon: {
        width: 32,
        height: 32,
        tintColor: '#00bfc5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#00bfc5',
        marginVertical: 16,
        textAlign: 'center',
    },
    searchBar: {
        width: '95%',
        borderWidth: 2,
        borderColor: '#00bfc5',
        borderRadius: 16,
        padding: 8,
        marginBottom: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        shadowColor: '#00bfc5',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        width: '100%',
        fontSize: 24,
        color: '#888',
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
    },
    listContainer: {
        width: '98%',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#00bfc5',
        marginBottom: 16,
        padding: 8,
        maxHeight: 350,
        minHeight: 220,
        shadowColor: '#00bfc5',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 4,
        marginBottom: 4,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
    },
    patientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        borderRadius: 8,
    },
    selectedRow: {
        backgroundColor: '#e0f7fa',
    },
    cell: {
        flex: 1,
        fontSize: 14,
        color: '#222',
        textAlign: 'center',
    },
    selectButton: {
        width: '95%',
        backgroundColor: '#00bfc5',
        borderRadius: 24,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 2,
        shadowColor: '#00bfc5',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    selectButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 26,
        letterSpacing: 1,
    },
});

const mapStateToProps = state => ({
    user: state.user,
    token: state.token,
    lang: state.lang,
    impersonating: state.impersonating,
});

const mapDispatchToProps = dispatch => ({
    addUser: user => dispatch({ type: 'ADD_USERINFO', payload: user }),
    setImpersonation: flag => dispatch({ type: 'SET_IMPERSONATION', payload: flag }),
    setPatientId: id => dispatch({ type: 'SET_PATIENT_ID', payload: id }),
    setPatientToken: token => dispatch({ type: 'SET_PATIENT_TOKEN', payload: token }),
});


export default connect(mapStateToProps, mapDispatchToProps)(PatientList);
