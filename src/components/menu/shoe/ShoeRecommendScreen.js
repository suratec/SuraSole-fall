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
} from 'react-native';
import { connect } from 'react-redux';
import HeaderFix from '../../common/HeaderFix';
import shoeLang from '../../../assets/language/menu/lang_shoe';
import { getLocalizedText } from '../../../assets/language/langUtils';
import orderLang from '../../../assets/language/menu/lang_orders';

export default connect(state => ({ lang: state.lang }))(function ShoeRecommendScreen({ navigation, lang }) {
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

    // Fetch catalog (silent failure keeps UI usable)
    useEffect(() => {
        let isMounted = true;
        fetch('https://api1.suratec.co.th/shoe-insoles')
            .then(res => res.json())
            .then(data => {
                if (!isMounted) return;
                if (data?.status === 'OK' && Array.isArray(data?.data)) {
                    setShoes(data.data);
                    setFilteredShoes(data.data);
                }
            })
            .catch(() => {
                // no-op
            });
        return () => { isMounted = false; };
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
        BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
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
        if (typeof navigation?.getParam === 'function') return navigation.getParam(key, def);
        // fallback for any custom injection
        return navigation?.state?.params?.[key] ?? def;
    };

    return (
        <View style={styles.container}>
            <HeaderFix
                icon_left="left"
                onpress_left={() => navigation.goBack()}
                title={getLocalizedText(lang, shoeLang.title)}
                text_rigth={lang === 1 ? orderLang.title.thai : lang === 2 ? orderLang.title.jpn : orderLang.title.eng}
                onpress_rigth={() => navigation.navigate('OrdersScreen')}
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

            <FlatList
                key={NUM_COLUMNS}
                numColumns={NUM_COLUMNS}
                data={filteredShoes}
                renderItem={renderShoe}
                keyExtractor={(item, index) => (item?.product_name ?? 'item') + index}
                contentContainerStyle={styles.list}
            />

            <TouchableOpacity
                style={[styles.addButton, selectedShoes.length === 0 && { backgroundColor: '#ccc' }]}
                onPress={() => {
                    if (selectedShoes.length > 0) {
                        const patient = getParam('patient', null);
                        navigation.navigate('CartScreen', {
                            selectedShoes: (shoes || []).filter(shoe =>
                                selectedShoes.includes(shoe?.product_name)
                            ),
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
});
