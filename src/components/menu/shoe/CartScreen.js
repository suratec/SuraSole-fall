import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    BackHandler,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { useIsFocused, useRoute } from '@react-navigation/native';
import HeaderFix from '../../common/HeaderFix';
import shoeLang from '../../../assets/language/menu/lang_shoe';
import { getLocalizedText } from '../../../assets/language/langUtils';
import cartApi from '../../../services/cartApi';

const UK_SIZES = ['5', '6', '7', '8', '9', '10', '11', '12'];

const CartScreen = ({ navigation, lang, user }) => {
    const route = useRoute();
    // v4-safe param access (with fallback for route.params if ever present)
    const getParam = (key, def = null) => {
        return route?.params?.[key] ?? navigation?.state?.params?.[key] ?? def;
    };

    const selectedShoes = getParam('itemsToAddToCart', []) || getParam('selectedShoes', []) || [];
    const patient = getParam('patient', null);

    const isFocused = useIsFocused();
    const [cartItems, setCartItems] = useState([]);

    // Sync items from navigation params
    useEffect(() => {
        if (!isFocused) return;

        const selected = getParam('itemsToAddToCart', []) || getParam('selectedShoes', []) || [];
        console.log('Syncing cartItems (isFocused). Count:', selected.length);
        setCartItems(selected.map(item => ({
            ...item,
            quantity: 1,
            size: '',
        })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFocused, navigation.state?.params]); // Refresh every time we come back or params change

    const [sizeModal, setSizeModal] = useState({ visible: false, index: null });
    const [note, setNote] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const [cartId, setCartId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingCart, setIsCreatingCart] = useState(false);
    const [doctorInfo, setDoctorInfo] = useState(null);

    // Load doctor info (for doctor_id when clinician orders for a patient)
    useEffect(() => {
        const loadDoctor = async () => {
            try {
                const doctorUser = await AsyncStorage.getItem('doctor_user');
                if (doctorUser) setDoctorInfo(JSON.parse(doctorUser));
            } catch (e) {
                console.warn('Failed to load doctor_user from storage', e);
            }
        };
        loadDoctor();
    }, []);

    // Hardware back: close size modal first, else navigate back
    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (sizeModal.visible) {
                setSizeModal({ visible: false, index: null });
                return true;
            }
            if (navigation?.canGoBack?.()) {
                navigation.goBack();
                return true;
            }
            return false;
        });
        return () => handler.remove();
    }, [navigation, sizeModal]);

    // Create cart on mount (real backend call)
    useEffect(() => {
        const createCart = async () => {
            console.log('CartScreen mounted. Parameters:', { 
                selectedShoesCount: selectedShoes?.length,
                patient: patient?.id_data_role || 'none',
                user: user?.id_customer || user?.id_data_role || 'none'
            });

            setIsCreatingCart(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            try {
                // Load doctor info locally to avoid dependency loop or double execution
                let currentDoctorInfo = doctorInfo;
                if (!currentDoctorInfo) {
                    const saved = await AsyncStorage.getItem('doctor_user');
                    if (saved) currentDoctorInfo = JSON.parse(saved);
                }

                // Prefer patient id if clinician ordering on behalf of a patient
                const customerId =
                    patient?.id_data_role ??
                    user?.id_customer ??
                    user?.id_data_role ??
                    user?.id ??
                    null;

                const doctorId = (currentDoctorInfo?.doctor_id ?? user?.doctor_id) ?? 'null';
                const hospitalId = user?.hospital_id ?? null;

                console.log('Requesting cart creation for customer:', customerId);
                const res = await cartApi.createCart(
                    customerId,
                    doctorId,
                    hospitalId,
                    note || 'Shoe order from mobile app',
                    { signal: controller.signal } // Pass signal if cartApi supports it (adding it next)
                );
                clearTimeout(timeoutId);

                if ((res?.status === 'OK' || res?.status === 'success') && res?.cart_id) {
                    console.log('Cart created successfully. ID:', res.cart_id);
                    setCartId(res.cart_id);
                } else {
                    console.error('Failed to create cart:', res);
                    Alert.alert('Error', 'Failed to create cart on server');
                }
            } catch (e) {
                clearTimeout(timeoutId);
                if (e.name === 'AbortError') {
                    console.error('Cart creation timed out');
                    Alert.alert('Network Timeout', 'The server is responding slowly. Please try again or check your connection.');
                } else {
                    console.error('Error creating cart:', e);
                    Alert.alert('Error', 'Failed to create cart. Please try again.');
                }
            } finally {
                setIsCreatingCart(false);
            }
        };

        createCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const updateSize = (size) => {
        const updated = [...cartItems];
        if (sizeModal.index !== null) {
            updated[sizeModal.index].size = size;
            setCartItems(updated);
        }
        setSizeModal({ visible: false, index: null });
    };

    const updateQuantity = (index, delta) => {
        const updated = [...cartItems];
        const newQty = (updated[index].quantity || 1) + delta;
        updated[index].quantity = newQty < 1 ? 1 : newQty;
        setCartItems(updated);
    };

    const removeItem = (index) => {
        const updated = [...cartItems];
        updated.splice(index, 1);
        setCartItems(updated);
    };

    const calculateTotal = () =>
        cartItems.reduce(
            (sum, item) =>
                sum + ((parseFloat(item?.price ?? 0) || 0) * (item?.quantity || 1)),
            0
        );

    const handleConfirm = async () => {
        const missingSize = cartItems.some((item) => !item.size);
        if (missingSize) {
            Alert.alert(
                getLocalizedText(lang, shoeLang.missingSize),
                getLocalizedText(lang, shoeLang.pleaseSelectSize)
            );
            return;
        }

        if (!cartId) {
            Alert.alert('Error', 'Cart not created yet. Please wait...');
            return;
        }

        setIsLoading(true);
        try {
            // Add items to cart
            for (const item of cartItems) {
                // Ensure we send a product_id the backend recognizes
                let productId = item?.id ?? item?.product_id ?? item?.productId;
                if (!productId) {
                    productId = 15; // TODO: replace with real product mapping
                    console.warn(`No product_id for ${item?.product_name}; using default: ${productId}`);
                }

                const priceNum = parseFloat(item?.price ?? 0) || 0;

                const addRes = await cartApi.addItemToCart(
                    cartId,
                    productId,
                    item?.product_name ?? '',
                    priceNum,
                    item?.quantity || 1,
                    item?.size
                );

                if (addRes?.status !== 'OK' && addRes?.status !== 'success') {
                    throw new Error(`Failed to add item ${item?.product_name || productId} to cart`);
                }
            }

            // Confirm order
            const totalPrice = calculateTotal();

            const customerId =
                patient?.id_data_role ??
                user?.id_customer ??
                user?.id_data_role ??
                user?.id ??
                null;

            const doctorId = (doctorInfo?.doctor_id ?? user?.doctor_id) ?? 'null';
            const hospitalId = user?.hospital_id ?? null;
            const memo = note || 'Shoe order from mobile app';

            const confirmRes = await cartApi.confirmOrder(
                cartId,
                customerId,
                doctorId,
                hospitalId,
                totalPrice,
                memo
            );

            if (confirmRes?.status === 'OK' || confirmRes?.status === 'success') {
                setShowPopup(true);
                setTimeout(() => {
                    setShowPopup(false);
                    navigation.navigate('Home');
                }, 2000);
            } else {
                throw new Error('Failed to confirm order');
            }
        } catch (err) {
            console.error('Error processing order:', err);
            Alert.alert('Error', 'Failed to process order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.rowCard}>
            {/* PRODUCT */}
            <View style={[styles.column, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                {!!item?.image_url && <Image source={{ uri: item.image_url }} style={styles.image} />}
                <View style={styles.itemDetails}>
                    <Text style={styles.name}>{item?.product_name || '-'}</Text>
                    <TouchableOpacity onPress={() => setSizeModal({ visible: true, index })} style={styles.sizeBox}>
                        <Text style={{ fontSize: 13, color: item?.size ? '#000' : '#888' }}>
                            {item?.size
                                ? `${getLocalizedText(lang, shoeLang.uk)} ${item.size}`
                                : getLocalizedText(lang, shoeLang.selectSize)}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* PRICE */}
            <View style={styles.column}>
                <Text style={styles.price}>
                    {(item?.price ?? '-')}{' '}
                    THB
                </Text>
            </View>

            {/* QTY */}
            <View style={[styles.column, styles.qtyControls]}>
                <TouchableOpacity onPress={() => updateQuantity(index, -1)} style={styles.qtyBtn}>
                    <Text style={styles.qtySymbol}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item?.quantity || 1}</Text>
                <TouchableOpacity onPress={() => updateQuantity(index, 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtySymbol}>+</Text>
                </TouchableOpacity>
            </View>

            {/* REMOVE */}
            <View style={styles.column}>
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.select({ ios: 'padding', android: undefined })}
            style={styles.container}
        >
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={getLocalizedText(lang, shoeLang.cart)}
            />

            <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 2 }]}>
                    {getLocalizedText(lang, shoeLang.product)}
                </Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.price)}</Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.qty)}</Text>
                <Text style={styles.headerText}>{getLocalizedText(lang, shoeLang.remove)}</Text>
            </View>

            <FlatList
                data={cartItems}
                keyExtractor={(item, i) => (item?.product_name ?? 'item') + i}
                renderItem={renderItem}
                ListHeaderComponent={
                    isCreatingCart ? (
                        <View style={styles.loadingHeader}>
                            <ActivityIndicator size="small" color="#00c3cc" />
                            <Text style={styles.loadingHeaderTex}>
                                {getLocalizedText(lang, shoeLang.creatingCart) || 'Initializing cart...'}
                            </Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    cartItems.length > 0 ? (
                        <View style={styles.noteSection}>
                            <Text style={styles.noteLabel}>
                                {getLocalizedText(lang, shoeLang.addNote)}
                            </Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder={getLocalizedText(lang, shoeLang.notePlaceholder)}
                                placeholderTextColor="#aaa"
                                value={note}
                                onChangeText={setNote}
                            />
                            <Text style={styles.total}>
                                {getLocalizedText(lang, shoeLang.total)}: ฿{calculateTotal().toFixed(2)}
                            </Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={{ paddingBottom: 140 }}
            />

            {cartItems.length > 0 && (
                <TouchableOpacity
                    style={[styles.confirmBtn, (isLoading || isCreatingCart) && { backgroundColor: '#ccc' }]}
                    onPress={handleConfirm}
                    disabled={isLoading || isCreatingCart}
                >
                    {isLoading || isCreatingCart ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.confirmText}>
                            {getLocalizedText(lang, shoeLang.confirm)}
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            {/* Size Modal */}
            <Modal
                transparent
                visible={sizeModal.visible}
                animationType="slide"
                onRequestClose={() => setSizeModal({ visible: false, index: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        {UK_SIZES.map((size) => (
                            <TouchableOpacity key={size} onPress={() => updateSize(size)} style={styles.modalItem}>
                                <Text style={styles.modalItemText}>
                                    {getLocalizedText(lang, shoeLang.uk)} {size}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity onPress={() => setSizeModal({ visible: false, index: null })}>
                            <Text style={[styles.modalItemText, { color: 'red', marginTop: 10 }]}>
                                {getLocalizedText(lang, shoeLang.cancel)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Confirmation Popup */}
            <Modal transparent visible={showPopup} animationType="fade">
                <View style={styles.popupOverlay}>
                    <View style={styles.popupBox}>
                        <Text style={styles.popupText}>
                            {getLocalizedText(lang, shoeLang.orderConfirmed)} 🎉
                        </Text>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eafcff' },

    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        backgroundColor: '#00c3cc',
        paddingHorizontal: 10,
    },
    headerText: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 13,
    },

    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 12,
        padding: 10,
        elevation: 2,
    },

    column: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    image: { width: 50, height: 50, borderRadius: 6, marginRight: 8 },

    itemDetails: { flex: 1, justifyContent: 'center', zIndex: 10, marginEnd: -10 },

    name: { fontSize: 14, fontWeight: 'bold', color: '#222' },

    sizeBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#f9f9f9',
    },

    price: { fontSize: 13, color: '#00a0a8', fontWeight: '600', marginStart: 10, marginEnd: -15 },

    qtyControls: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, marginStart: 30 },

    qtyBtn: { backgroundColor: '#00c3cc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

    qtySymbol: { fontSize: 14, color: '#fff', fontWeight: 'bold' },

    qtyText: { marginHorizontal: 3, fontSize: 14, color: '#333' },

    deleteBtn: { marginTop: 4, marginEnd: -20 },

    deleteText: { fontSize: 18, color: '#cc0000' },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
    loadingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    loadingHeaderTex: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },


    noteSection: { marginHorizontal: 16, marginTop: 20 },
    noteLabel: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 6 },
    noteInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#000',
    },
    total: { textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#007B7F', marginTop: 12 },

    confirmBtn: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#00c3cc',
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: 'center',
    },
    confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000080',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '80%' },
    modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
    modalItemText: { fontSize: 17, textAlign: 'center', color: '#333' },

    popupOverlay: {
        flex: 1,
        backgroundColor: '#00000088',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupBox: { backgroundColor: '#00c3cc', padding: 30, borderRadius: 20 },
    popupText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
});

export default connect((state) => ({ lang: state.lang, user: state.user }))(CartScreen);
