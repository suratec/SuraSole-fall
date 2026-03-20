import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Card as PaperCard, Button as PaperButton, Avatar } from 'react-native-paper';
import VectorIcon from 'react-native-vector-icons/MaterialCommunityIcons';

export const Container = ({ children, style }) => <View style={[{ flex: 1 }, style]}>{children}</View>;
export const Content = ({ children, style }) => <ScrollView style={[{ flex: 1 }, style]}>{children}</ScrollView>;
export const Header = ({ children, style }) => <View style={[{ height: 56, justifyContent: 'center' }, style]}>{children}</View>;
export const Body = ({ children, style }) => <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}>{children}</View>;
export const Left = ({ children, style }) => <View style={[{ flex: 1, alignItems: 'flex-start', justifyContent: 'center' }, style]}>{children}</View>;
export const Right = ({ children, style }) => <View style={[{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }, style]}>{children}</View>;

export const Card = ({ children, style }) => (
    <View style={[{
        marginVertical: 5,
        marginHorizontal: 10,
        padding: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        // Elevation/Shadow
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    }, style]}>
        {children}
    </View>
);
export const CardItem = ({ children, style, button, onPress }) => {
    const Component = button ? TouchableOpacity : View;
    return (
        <Component onPress={onPress} activeOpacity={0.8} style={[{ padding: 10, flexDirection: 'row', alignItems: 'center' }, style]}>
            {children}
        </Component>
    );
};
export const Title = ({ children, style }) => <Text style={[{ fontSize: 18, fontWeight: 'bold' }, style]}>{children}</Text>;
export const Subtitle = ({ children, style }) => <Text style={[{ fontSize: 12 }, style]}>{children}</Text>;

export const Icon = ({ name, style, ...props }) => <VectorIcon name={name || 'help'} style={style} {...props} />;
export const Button = ({ children, onPress, style, ...props }) => (
    <PaperButton mode="contained" onPress={onPress} style={style} {...props}>
        {children}
    </PaperButton>
);

export const Thumbnail = ({ source, style, width = 56, height = 56 }) => (
    <Image source={source} style={[{ width, height, borderRadius: width / 2 }, style]} />
);

export const Item = ({ children, style }) => <View style={[{ borderBottomWidth: 1, borderColor: '#ccc' }, style]}>{children}</View>;
export const Input = (props) => <Text {...props} />; // Placeholder
export const TabHeading = ({ children, style }) => <View style={style}>{children}</View>;
export const ActionSheet = { show: () => console.log('ActionSheet not implemented') };
export const Toast = { show: () => console.log('Toast not implemented') };

export const Grid = ({ children, style, ...props }) => <View style={[{ flex: 1 }, style]} {...props}>{children}</View>;
export const Row = ({ children, style, ...props }) => <View style={[{ flexDirection: 'row', flex: 1 }, style]} {...props}>{children}</View>;
export const Col = ({ children, style, ...props }) => <View style={[{ flexDirection: 'column', flex: 1 }, style]} {...props}>{children}</View>;

export default {
    Container, Content, Header, Body, Left, Right, Card, CardItem, Icon, Button, Thumbnail, Item, Input, TabHeading, ActionSheet, Toast,
    Grid, Row, Col, Title, Subtitle
};
