import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

const PageControlShim = ({
    numberOfPages = 0,
    currentPage = 0,
    hidesForSinglePage = false,
    pageIndicatorTintColor = 'gray',
    currentPageIndicatorTintColor = 'white',
    indicatorStyle,
    currentIndicatorStyle,
    indicatorSize = { width: 8, height: 8 },
    onPageIndicatorPress,
    style
}) => {
    if (hidesForSinglePage && numberOfPages <= 1) {
        return null;
    }

    const pages = [];
    for (let i = 0; i < numberOfPages; i++) {
        const isActive = i === currentPage;
        pages.push(
            <TouchableOpacity
                key={i}
                onPress={() => onPageIndicatorPress && onPageIndicatorPress(i)}
                style={[
                    {
                        width: indicatorSize.width,
                        height: indicatorSize.height,
                        borderRadius: indicatorSize.width / 2,
                        marginHorizontal: 5,
                        backgroundColor: isActive ? currentPageIndicatorTintColor : pageIndicatorTintColor,
                    },
                    indicatorStyle,
                    isActive && currentIndicatorStyle,
                ]}
            />
        );
    }

    return (
        <View style={[styles.container, style]}>
            {pages}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PageControlShim;
