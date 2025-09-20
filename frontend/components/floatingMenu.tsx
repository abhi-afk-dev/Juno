import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';


const menuItems = [
    { icon: 'calculator', route: '/cal' },
    { icon: 'time', route: '/history' },
    { icon: 'home', route: '/home' },
] as const;

export default function FloatingMenu() {
    const router = useRouter();
    const segments = useSegments();
    const [isOpen, setIsOpen] = useState(false);
    const animation = useSharedValue(0);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const context = useSharedValue({ x: 0, y: 0 });

    const toggleMenu = () => {
        const toValue = isOpen ? 0 : 1;
        animation.value = withSpring(toValue, { damping: 50 });
        setIsOpen(!isOpen);
    };

    const handleNavigation = (route: typeof menuItems[number]['route']) => {
        toggleMenu();
        router.push(route); 
    };

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            context.value = { x: translateX.value, y: translateY.value };
        })
        .onUpdate((event) => {
            translateX.value = event.translationX + context.value.x;
            translateY.value = event.translationY + context.value.y;
        });
        
    const draggableStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
            ],
        };
    });

    const mainButtonIconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${animation.value * 90}deg` }],
    }));

    const activeRouteName = segments[segments.length - 1];

    return (
        <GestureDetector gesture={dragGesture}>
            <Animated.View style={[styles.container, draggableStyle]}>
                {menuItems.map((item, index) => {
                    const isActive = item.route.includes(activeRouteName);
                    const backgroundColor = isActive ? '#101010' : '#323232';

                    const itemAnimatedStyle = useAnimatedStyle(() => {
                        const translateY = (index + 1) * -70 * animation.value; 
                        return {
                            transform: [{ translateY }],
                            opacity: animation.value,
                        };
                    });
                    return (
                        <Animated.View key={item.route} style={[styles.menuItem, itemAnimatedStyle]}>
                            <TouchableOpacity
                                style={[styles.menuButton, { backgroundColor }]}
                                onPress={() => handleNavigation(item.route)}
                            >
                                <Ionicons name={item.icon} size={28} color="white" />
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}

                <TouchableOpacity style={styles.mainButton} onPress={toggleMenu} activeOpacity={0.8}>
                    <Animated.View style={mainButtonIconStyle}>
                        <Ionicons name={isOpen ? 'close' : 'add'} size={36} color="white" />
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 20,
        bottom: 140,
        alignItems: 'center',
    },
    mainButton: {
        width: 70, 
        height: 70,
        borderRadius: 35,
        backgroundColor: '#1d1d1dff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    menuItem: {
        position: 'absolute',
    },
    menuButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
});