import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default () => (
    <View style={styles.container}>
        <Text style={styles.text}>SuraSole-fall (Optimized Mode)</Text>
        <Text style={styles.subtext}>New Architecture: Active</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subtext: {
        fontSize: 16,
        color: '#666',
        marginTop: 10,
    },
});