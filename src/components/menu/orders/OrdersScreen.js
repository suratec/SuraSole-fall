// OrdersScreen.js (React Navigation v4 friendly)
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, BackHandler } from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import HeaderFix from '../../common/HeaderFix'; // <-- adjust path if needed
import orderLang from '../../../assets/language/menu/lang_orders'; // <-- adjust path if needed

function OrdersScreen({ navigation, lang, user }) {
    const isFocused = useIsFocused();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch orders once user is available (or when it changes)
    useEffect(() => {
        let isCancelled = false;

        const fetchOrders = async () => {
            if (!user || !user.id_customer) {
                if (!isCancelled) setLoading(false);
                return;
            }

            try {
                const shoesRes = await fetch('https://api1.suratec.co.th/shoe-insoles');
                const shoesData = await shoesRes.json();
                const shoes = shoesData.status === 'OK' ? shoesData.data : [];

                const ordersRes = await fetch(`https://api1.suratec.co.th/order/customer/${user.id_customer}`);
                const ordersData = await ordersRes.json();
                console.log('Orders Data:', ordersData);

                if (!isCancelled && ordersData.status === 'success') {
                    const formatted = ordersData.orders.map(order => ({
                        ...order,
                        items: order.cart.items.map(item => {
                            const shoe = shoes.find(s => s.product_id === item.product_id);
                            return {
                                ...item,
                                // prefer explicit product_name; else fallback if shoe exists; else Unknown
                                name: item.product_name ? item.product_name : (shoe ? (shoe.product_name || 'Unknown Product') : 'Unknown Product'),
                            };
                        }),
                    }));
                    setOrders(formatted);
                }
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        fetchOrders();
        return () => { isCancelled = true; };
    }, [user]);

    // Back handler only when screen is focused (v4)
    const onBackPress = useCallback(() => {
        navigation.goBack();
        return true;
    }, [navigation]);

    useEffect(() => {
        if (!isFocused) return;
        BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isFocused, onBackPress]);

    const getStatusText = (status) => {
        switch (status) {
            case '1':
                return lang === 1 ? orderLang.processing.thai : lang === 2 ? orderLang.processing.jpn : orderLang.processing.eng;
            case '2':
                return lang === 1 ? orderLang.shipped.thai : lang === 2 ? orderLang.shipped.jpn : orderLang.shipped.eng;
            case '3':
                return lang === 1 ? orderLang.delivered.thai : lang === 2 ? orderLang.delivered.jpn : orderLang.delivered.eng;
            default:
                return lang === 1 ? orderLang.unknown.thai : lang === 2 ? orderLang.unknown.jpn : orderLang.unknown.eng;
        }
    };

    const renderOrderItem = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>
                    {lang === 1 ? orderLang.orderId.thai : lang === 2 ? orderLang.orderId.jpn : orderLang.orderId.eng}
                    {item.id}
                </Text>
                <Text style={styles.orderDate}>{item.created_date}</Text>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.orderStatus}>
                    {lang === 1 ? orderLang.status.thai : lang === 2 ? orderLang.status.jpn : orderLang.status.eng}
                    {getStatusText(item.status)}
                </Text>
                <Text style={styles.orderTotal}>
                    {lang === 1 ? orderLang.total.thai : lang === 2 ? orderLang.total.jpn : orderLang.total.eng}
                    ฿{item.totalprice}
                </Text>
            </View>

            <View style={styles.orderItems}>
                <Text style={styles.itemsHeader}>
                    {lang === 1 ? orderLang.items.thai : lang === 2 ? orderLang.items.jpn : orderLang.items.eng}
                </Text>
                {item.items.map((product, index) => (
                    <Text key={index} style={styles.itemText}>
                        - {product.name} ({lang === 1 ? orderLang.qty.thai : lang === 2 ? orderLang.qty.jpn : orderLang.qty.eng}{product.quantity})
                    </Text>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={lang === 1 ? orderLang.title.thai : lang === 2 ? orderLang.title.jpn : orderLang.title.eng}
            />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#00c3cc" />
                </View>
            ) : orders.length === 0 ? (
                <View style={styles.center}>
                    <Text>
                        {lang === 1 ? orderLang.noOrders.thai : lang === 2 ? orderLang.noOrders.jpn : orderLang.noOrders.eng}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

// HOC order: withNavigationFocus first, then connect
export default connect(
    state => ({ lang: state.lang, user: state.user })
)(OrdersScreen);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0faff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 10 },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#ccc',
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    orderDate: { fontSize: 14, color: '#666' },
    orderDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    orderStatus: { fontSize: 14, color: '#007B7F' },
    orderTotal: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    orderItems: {},
    itemsHeader: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    itemText: { fontSize: 14, color: '#555', marginLeft: 10 },
});
