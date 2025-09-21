import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Text,
} from "react-native";

type TimerProps = {
    timeLeft: number;
    isActive: boolean;
    onStartPause: () => void;
    onReset: () => void;
    onAdjustTime: (amount: number) => void;
};

const Timer: React.FC<TimerProps> = ({
    timeLeft,
    isActive,
    onStartPause,
    onReset,
    onAdjustTime
}) => {
    const formatTimerDisplay = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <View style={styles.featureContainer}>
            {timeLeft <= 0 && !isActive && <Text style={styles.timerDoneText}>Time's up!</Text>}
            <Text style={styles.timerText}>{formatTimerDisplay(timeLeft)}</Text>

            <View style={styles.timeAdjustRow}>
                <TouchableOpacity onPress={() => onAdjustTime(300000)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+5m</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAdjustTime(600000)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+10m</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAdjustTime(900000)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+15m</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAdjustTime(1800000)} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+30m</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={onReset}>
                    <Text style={styles.buttonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, isActive ? styles.stopButton : styles.startButton]} onPress={onStartPause}>
                    <Text style={styles.buttonText}>{isActive ? 'Pause' : 'Set'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Timer;

const styles = StyleSheet.create({
    container: {
        width: '80%',
        flex: 1,
    },
    featureContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    timerText: {
        fontSize: 42,
        color: '#FFFFFF',
        marginBottom: 30,
        fontFamily: 'monospace',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
        marginTop: 20,
    },
    button: {
        width: 100,
        height: 50,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    buttonText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    startButton: {
        backgroundColor: 'rgba(46, 204, 113, 0.3)',
        borderColor: '#2ecc71',
    },
    stopButton: {
        backgroundColor: 'rgba(231, 76, 60, 0.3)',
        borderColor: '#e74c3c',
    },
    resetButton: {
        backgroundColor: 'rgba(127, 140, 141, 0.3)',
        borderColor: '#7f8c8d',
    },
    timeAdjustRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    adjustButton: {
        backgroundColor: '#1B263B',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    adjustButtonText: {
        color: '#E0E1DD',
        fontSize: 14,
    },
    timerDoneText: {
        color: '#2ecc71',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    }
});

    // "ios": {

    //   "supportsTablet": true

    // },

    // "android": {

    //   "adaptiveIcon": {

    //     "backgroundColor": "#000000"

    //   },

    //   "edgeToEdgeEnabled": true,

    //   "predictiveBackGestureEnabled": false,

    //   "package": "com.abhi000001.frontend",

    //   "softwareKeyboardLayoutMode":"pan"

    // },