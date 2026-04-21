import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    TextInput,
    ScrollView,
    useWindowDimensions,
    BackHandler,
    ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import HeaderFix from '../../common/HeaderFix';
import shoeLang from '../../../assets/language/menu/lang_shoe';
import { getLocalizedText } from '../../../assets/language/langUtils';
import orderLang from '../../../assets/language/menu/lang_orders';
import ROOT_API from '../../../config/Api';

export default connect(state => ({ lang: state.lang }))(function ShoeRecommendScreen({ navigation, lang }) {
    const route = useRoute();
    const { width } = useWindowDimensions();
    const ITEM_MARGIN = 10;
    const NUM_COLUMNS = Math.max(3, Math.floor(width / 140));
    const ITEM_WIDTH = (width - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

    const [shoes, setShoes] = useState([]);
    const [filteredShoes, setFilteredShoes] = useState([]);
    const [selectedShoes, setSelectedShoes] = useState([]);
    const [filterVisible, setFilterVisible] = useState(false);
    const [filters, setFilters] = useState({ group: [], subgroup: [], type: [] });
    const [pendingFilters, setPendingFilters] = useState({ group: [], subgroup: [], type: [] });
    const [sortAscending, setSortAscending] = useState(true);
    const [searchText, setSearchText] = useState('');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchShoes = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s

        try {
            const url = `${ROOT_API}shoe-insoles`;
            console.log('Fetching shoes from:', url, isRefreshing ? '(refresh)' : '(initial)');
            
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            console.log('Response status:', res.status);
            
            const data = await res.json();
            console.log('API Status:', data?.status, '| Data Count:', Array.isArray(data?.data) ? data.data.length : 'not an array');

            if (data?.status === 'OK' && Array.isArray(data?.data)) {
                setShoes(data.data);
                setFilteredShoes(data.data);
            } else {
                console.warn('Unexpected data format or status:', data);
                if (data?.status !== 'OK') {
                    setError(`Server returned status: ${data?.status || 'Unknown'}`);
                } else if (!Array.isArray(data?.data)) {
                    setError('Invalid data format: expected list of products');
                }
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                console.error('Fetch shoes error: Request timed out');
                setError('Request timed out (Server is too slow)');
            } else {
                console.error('Fetch shoes error:', err);
                setError(err.message || 'Failed to connect to server');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch catalog
    useEffect(() => {
        fetchShoes();
    }, []);

    // Apply filters / search / sort
    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchText, sortAscending, shoes]);

    // Android hardware back -> behave like header back
    useEffect(() => {
        const onBackPress = () => {
            navigation.goBack();
            return true; // prevent app exit
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [navigation]);

    const applyFilters = () => {
        let result = Array.isArray(shoes) ? [...shoes] : [];

        if (filters.group.length > 0)
            result = result.filter(item => filters.group.includes(item?.product_group));
        if (filters.subgroup.length > 0)
            result = result.filter(item => filters.subgroup.includes(item?.sub_group));
        if (filters.type.length > 0)
            result = result.filter(item => filters.type.includes(item?.producttype));

        if (searchText)
            result = result.filter(item =>
                (item?.product_name || '').toLowerCase().includes(searchText.toLowerCase())
            );

        result.sort((a, b) => {
            const priceA = parseFloat(a?.price ?? 0) || 0;
            const priceB = parseFloat(b?.price ?? 0) || 0;
            return sortAscending ? priceA - priceB : priceB - priceA;
        });

        setFilteredShoes(result);
    };

    const toggleSelect = (name) => {
        setSelectedShoes(prev =>
            prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
        );
    };

    const uniqueValues = (key) =>
        Array.from(new Set((shoes || []).map(item => item?.[key]).filter(Boolean)));

    const renderShoe = ({ item }) => {
        const selected = selectedShoes.includes(item?.product_name);
        return (
            <TouchableOpacity
                style={[styles.item, { width: ITEM_WIDTH }, selected && styles.selected]}
                onPress={() => toggleSelect(item?.product_name)}
                activeOpacity={0.8}
            >
                {!!item?.image_url && (
                    <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="contain" />
                )}
                {selected && (
                    <View style={styles.check}>
                        <Text style={styles.checkText}>✓</Text>
                    </View>
                )}
                <Text style={styles.name}>{item?.product_name ?? '-'}</Text>
                <Text style={styles.price}>฿{item?.price ?? '-'}</Text>
            </TouchableOpacity>
        );
    };

    // v4-safe way to read a param (with fallbacks)
    const getParam = (key, def = null) => {
        return route?.params?.[key] ?? navigation?.getParam?.(key, def) ?? navigation?.state?.params?.[key] ?? def;
    };

    const renderEmpty = () => {
        if (loading) return null;
        if (error) {
            return (
                <View style={styles.center}>
                    <Text style={styles.errorText}>{getLocalizedText(lang, shoeLang.error)}</Text>
                    <Text style={styles.errorSubText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchShoes()}>
                        <Text style={styles.retryText}>{getLocalizedText(lang, shoeLang.retry)}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>{getLocalizedText(lang, shoeLang.noData)}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={getLocalizedText(lang, shoeLang.title)}
                text_rigth={lang === 1 ? orderLang.title.thai : lang === 2 ? orderLang.title.jpn : orderLang.title.eng}
                onpress_rigth={() => navigation.navigate('OrdersScreen')}
                rightPill
            />

            <View style={styles.searchSortRow}>
                <TextInput
                    placeholder={getLocalizedText(lang, shoeLang.searchPlaceholder)}
                    value={searchText}
                    onChangeText={setSearchText}
                    style={styles.searchInput}
                    placeholderTextColor="#999"
                />
                <TouchableOpacity
                    onPress={() => {
                        setPendingFilters(filters);
                        setFilterVisible(true);
                    }}
                    style={styles.sortBtn}
                >
                    <Text style={styles.sortText}>{getLocalizedText(lang, shoeLang.filter)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSortAscending(!sortAscending)}
                    style={styles.sortBtn}
                >
                    <Text style={styles.sortText}>
                        {sortAscending
                            ? `⬆️ ${getLocalizedText(lang, shoeLang.price)}`
                            : `⬇️ ${getLocalizedText(lang, shoeLang.price)}`}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#00c3cc" />
                    <Text style={styles.loadingText}>{getLocalizedText(lang, shoeLang.loading)}</Text>
                </View>
            ) : (
                <FlatList
                    key={NUM_COLUMNS}
                    numColumns={NUM_COLUMNS}
                    data={filteredShoes}
                    renderItem={renderShoe}
                    keyExtractor={(item, index) => (item?.product_name ?? 'item') + index}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={renderEmpty}
                    onRefresh={() => fetchShoes(true)}
                    refreshing={refreshing}
                />
            )}

            <TouchableOpacity
                style={[styles.addButton, selectedShoes.length === 0 && { backgroundColor: '#ccc' }]}
                onPress={() => {
                    if (selectedShoes.length > 0) {
                        const patient = getParam('patient', null);
                        const toPass = (shoes || []).filter(shoe =>
                            selectedShoes.includes(shoe?.product_name)
                        );
                        console.log('Navigating to CartScreen. Selected names:', selectedShoes.length, 'Objects to pass:', toPass.length);
                        navigation.navigate('CartScreen', {
                            itemsToAddToCart: toPass,
                            patient, // pass through if present
                        });
                    }
                }}
                disabled={selectedShoes.length === 0}
            >
                <Text style={styles.addButtonText}>{getLocalizedText(lang, shoeLang.add)}</Text>
            </TouchableOpacity>

            {/* Filter Modal */}
            <Modal
                visible={filterVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setFilterVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>
                            {getLocalizedText(lang, shoeLang.filterOptions)}
                        </Text>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            {['group', 'subgroup', 'type'].map((key, index) => (
                                <View key={index} style={styles.filterSection}>
                                    <Text style={styles.filterHeader}>
                                        {key === 'group'
                                            ? getLocalizedText(lang, shoeLang.group)
                                            : key === 'subgroup'
                                                ? getLocalizedText(lang, shoeLang.subgroup)
                                                : getLocalizedText(lang, shoeLang.productType)}
                                    </Text>
                                    <View style={styles.tagContainer}>
                                        {uniqueValues(
                                            key === 'group'
                                                ? 'product_group'
                                                : key === 'subgroup'
                                                    ? 'sub_group'
                                                    : 'producttype'
                                        ).map(value => (
                                            <TouchableOpacity
                                                key={String(value)}
                                                onPress={() =>
                                                    setPendingFilters(prev => {
                                                        const isSelected = prev[key].includes(value);
                                                        const updated = isSelected
                                                            ? prev[key].filter(v => v !== value)
                                                            : [...prev[key], value];
                                                        return { ...prev, [key]: updated };
                                                    })
                                                }
                                                style={[
                                                    styles.filterTag,
                                                    pendingFilters[key].includes(value) && styles.activeTag,
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterTagText,
                                                        pendingFilters[key].includes(value) && styles.activeTagText,
                                                    ]}
                                                >
                                                    {String(value)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={() => setPendingFilters({ group: [], subgroup: [], type: [] })}
                                style={[styles.closeBtn, { backgroundColor: '#ccc' }]}
                            >
                                <Text style={styles.closeText}>
                                    {getLocalizedText(lang, shoeLang.reset)}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setFilters(pendingFilters);
                                    setFilterVisible(false);
                                }}
                                style={styles.closeBtn}
                            >
                                <Text style={styles.closeText}>
                                    {getLocalizedText(lang, shoeLang.apply)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0faff' },
    header: {
        backgroundColor: '#00c3cc',
        paddingVertical: 18,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    searchSortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        justifyContent: 'space-around',
        backgroundColor: '#fff',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#eee',
        padding: 8,
        marginRight: 8,
        borderRadius: 8,
        color: '#000',
    },
    sortBtn: {
        backgroundColor: '#e0f7f9',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 5,
    },
    sortText: { color: '#007B7F', fontWeight: '600' },
    list: {
        paddingBottom: 80,
        paddingHorizontal: 8,
    },
    item: {
        margin: 6,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: 'center',
        shadowColor: '#ccc',
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 3,
    },
    selected: {
        borderWidth: 2,
        borderColor: '#00cc66',
    },
    image: {
        width: 60,
        height: 60,
    },
    name: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
        color: '#444',
    },
    price: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    check: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: '#00c853',
        borderRadius: 12,
        padding: 2,
    },
    checkText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#00c3cc',
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '85%',
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    closeBtn: {
        backgroundColor: '#00c3cc',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterSection: {
        marginBottom: 16,
    },
    filterHeader: {
        backgroundColor: '#f2f2f2',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        // RN 0.72+ supports `gap`, but keep margin on tags for backward safety
        // gap: 8,
    },
    filterTag: {
        backgroundColor: '#e0f7f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 4,
    },
    filterTagText: {
        color: '#007B7F',
        fontWeight: '500',
    },
    activeTag: {
        backgroundColor: '#00c3cc',
    },
    activeTagText: {
        color: 'white',
    },
    modalContent: {
        paddingBottom: 10,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: '50%',
        transform: [{ translateY: -10 }],
        padding: 8,
    },
    backText: {
        fontSize: 30,
        color: '#fff',
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 300,
    },
    loadingText: {
        marginTop: 10,
        color: '#00c3cc',
        fontSize: 16,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    errorSubText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 15,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    retryBtn: {
        backgroundColor: '#00c3cc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
