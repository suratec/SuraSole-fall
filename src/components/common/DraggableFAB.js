// src/components/common/DraggableFAB.js

import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Image,
    Animated,
    PanResponder,
    Dimensions,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';

// 1. Update this path to your new PNG
const FAB_ICON = require('../../assets/image/Chat/chat_fab_icon.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FAB_SIZE = 60;          // Diameter of the FAB
const MARGIN = 16;            // Minimum margin from screen edges

export default function DraggableFAB({ navigation }) {
    // Animated x/y value (top-left corner of FAB)
    const pan = useRef(
        new Animated.ValueXY({
            x: SCREEN_WIDTH - FAB_SIZE - MARGIN,                // start pinned to right
            // start near the bottom-right so it doesn't sit over the middle of content (esp. on tablets)
            y: SCREEN_HEIGHT - FAB_SIZE - 140,
        })
    ).current;

    // Keep a boolean to know whether currently on left or right half
    const [pinnedLeft, setPinnedLeft] = useState(false);

    // PanResponder for dragging gestures
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Start dragging if user moves finger a bit
                return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [
                    null,
                    {
                        dx: pan.x,
                        dy: pan.y,
                    },
                ],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                pan.flattenOffset();

                // Determine horizontal snapping: left or right?
                const centerX = pan.x._value + FAB_SIZE / 2;
                const willPinLeft = centerX < SCREEN_WIDTH / 2;

                // Calculate finalX: either MARGIN (left) or (SCREEN_WIDTH-FAB_SIZE-MARGIN)
                const finalX = willPinLeft
                    ? MARGIN
                    : SCREEN_WIDTH - FAB_SIZE - MARGIN;

                // Constrain finalY to screen bounds
                let finalY = pan.y._value;
                if (finalY < MARGIN) finalY = MARGIN;
                if (finalY > SCREEN_HEIGHT - FAB_SIZE - MARGIN) {
                    finalY = SCREEN_HEIGHT - FAB_SIZE - MARGIN;
                }

                // Animate snapping
                Animated.spring(pan, {
                    toValue: { x: finalX, y: finalY },
                    useNativeDriver: false,
                    bounciness: 8,
                }).start();

                // Update pinnedLeft state
                setPinnedLeft(willPinLeft);
            },
        })
    ).current;

    // Keep FAB in-bounds if phone rotates / dims change
    useEffect(() => {
        const dimListener = Dimensions.addEventListener('change', ({ window }) => {
            const { width, height } = window;
            // Snap to whichever edge it was on
            const willPinLeft = pan.x._value + FAB_SIZE / 2 < width / 2;
            const newX = willPinLeft ? MARGIN : width - FAB_SIZE - MARGIN;
            let newY = pan.y._value;
            if (newY < MARGIN) newY = MARGIN;
            if (newY > height - FAB_SIZE - MARGIN) {
                newY = height - FAB_SIZE - MARGIN;
            }
            pan.setValue({ x: newX, y: newY });
            setPinnedLeft(willPinLeft);
        });
        return () => {
            if (dimListener && dimListener.remove) dimListener.remove();
        };
    }, [pan]);

    // Tapping the FAB navigates to Chatbot
    const handlePress = () => {
        navigation.push('Chatbot');
    };

    return (
        <Animated.View
            style={[
                styles.fabContainer,
                {
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        // 2. Mirror (scaleX: -1) if pinned to left
                        pinnedLeft ? { scaleX: -1 } : { scaleX: 1 },
                    ],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
                <Image source={FAB_ICON} style={styles.fabIcon} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: 'transparent',
    },
    fabIcon: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        resizeMode: 'contain',
    },
});
