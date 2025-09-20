import React, { useState, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Vibration,
    ScrollView,
    StatusBar,
    TextStyle,
    ViewStyle,
    StyleProp,
} from 'react-native';
import Header from '../../components/header';
import { useTheme } from "../../components/themeProvider";

const { width } = Dimensions.get('window');
const isSmallDevice = width < 375;
const isTablet = width > 768;

interface HistoryItem {
    expression: string;
    result: string;
    timestamp: number;
}

type ButtonType = 'number' | 'operator' | 'clear' | 'function' | 'equals' | 'decimal' | 'science';

interface ButtonConfig {
    label: string;
    type: ButtonType;
    style?: ViewStyle;
}

// ---- CalculatorButton ----
interface CalculatorButtonProps {
    label: string;
    type: ButtonType;
    onPress: (label: string, type: ButtonType) => void;
    getButtonStyle: (type: ButtonType) => StyleProp<ViewStyle>;
    getButtonTextStyle: (type: ButtonType) => StyleProp<TextStyle>;
    customStyle?: ViewStyle;
}

const CalculatorButton = memo(({
    label,
    type,
    onPress,
    getButtonStyle,
    getButtonTextStyle,
    customStyle
}: CalculatorButtonProps) => {
    return (
        <TouchableOpacity
            style={[getButtonStyle(type), customStyle]}
            onPress={() => onPress(label, type)}
            activeOpacity={0.7}
        >
            <Text style={getButtonTextStyle(type)}>{label}</Text>
        </TouchableOpacity>
    );
});

// ---- Calculator ----
const Calculator: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [input, setInput] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isNewCalculation, setIsNewCalculation] = useState<boolean>(true);

    const getButtonStyle = useCallback((type: ButtonType): StyleProp<ViewStyle> => {
        const baseStyle: StyleProp<ViewStyle> = [
            styles.button,
            isSmallDevice ? styles.buttonSmall : null,
            isTablet ? styles.buttonTablet : null,
            { backgroundColor: isDark ? "#2a2a2a" : "#e6e6e6" },
        ];

        if (type === 'equals') baseStyle.push({ backgroundColor: isDark ? "#0e4effff" : "#4a90e2" });
        if (type === 'operator') baseStyle.push({ backgroundColor: isDark ? "#3d3d3dff" : "#dcdcdc" });
        if (type === 'clear') baseStyle.push({ backgroundColor: isDark ? "#ff2d2dff" : "#ffcccc" });

        return baseStyle;
    }, [isDark]);

    const getButtonTextStyle = useCallback((type: ButtonType): StyleProp<TextStyle> => {
        const baseStyle: StyleProp<TextStyle> = [
            styles.buttonText,
            { color: isDark ? "#fff" : "#000" },
        ];

        if (type === 'equals') baseStyle.push({ color: "#fff" });
        if (type === 'clear') baseStyle.push({ color: isDark ? "#fff" : "#a00" });

        return baseStyle;
    }, [isDark]);

    const handlePress = useCallback((label: string, type: ButtonType) => {
        Vibration.vibrate(10);
        if (type === 'number' || type === 'decimal') {
            if (isNewCalculation && result) {
                setInput(label);
                setResult('');
                setIsNewCalculation(false);
            } else {
                setInput(prev => prev + label);
                setIsNewCalculation(false);
            }
        } else if (type === 'operator') {
            const lastChar = input.slice(-1);
            if (['+', '-', '×', '÷', '%'].includes(lastChar)) {
                setInput(input.slice(0, -1) + label);
            } else if (input) {
                setInput(prev => prev + label);
                setIsNewCalculation(false);
            }
        } else if (type === 'clear') {
            if (label === 'AC') {
                setInput('');
                setResult('');
                setIsNewCalculation(true);
            } else if (label === '⌫') {
                setInput(prev => prev.slice(0, -1));
                setResult('');
                setIsNewCalculation(false);
            }
        } else if (type === 'equals') {
            if (input) {
                calculate(input);
            }
        }
    }, [input, result, isNewCalculation]);

    const calculate = useCallback((expression: string) => {
        try {
            const sanitizedExpression = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/%/g, '/100*');

            const calculatedResult = eval(sanitizedExpression);
            const fixedResult = Number.isInteger(calculatedResult) ? calculatedResult.toString() : calculatedResult.toFixed(2);
            setResult(fixedResult);
            setHistory(prev => [{ expression, result: fixedResult, timestamp: Date.now() }, ...prev]);
            setIsNewCalculation(true);
        } catch (e) {
            setResult('Error');
            setIsNewCalculation(true);
        }
    }, []);

    const buttonLayout: ButtonConfig[][] = useMemo(() => [
        [
            { label: 'AC', type: 'clear' },
            { label: '⌫', type: 'clear' },
            { label: '%', type: 'operator' },
            { label: '÷', type: 'operator' },
        ],
        [
            { label: '7', type: 'number' },
            { label: '8', type: 'number' },
            { label: '9', type: 'number' },
            { label: '×', type: 'operator' },
        ],
        [
            { label: '4', type: 'number' },
            { label: '5', type: 'number' },
            { label: '6', type: 'number' },
            { label: '-', type: 'operator' },
        ],
        [
            { label: '1', type: 'number' },
            { label: '2', type: 'number' },
            { label: '3', type: 'number' },
            { label: '+', type: 'operator' },
        ],
        [
            { label: '0', type: 'number', style: { flex: 2 } },
            { label: '.', type: 'decimal' },
            { label: '=', type: 'equals' },
        ],
    ], []);

    const displayValue = result || input || '0';
    const isError = result === 'Error';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#171717" : "#fff" }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#171717" : "#fff"} />
            <Header />
            <View style={styles.displayContainer}>
                <ScrollView style={styles.historyContainer} showsVerticalScrollIndicator={false}>
                    {history.slice(0, 3).map((item: HistoryItem) => (
                        <View key={item.timestamp} style={styles.historyItem}>
                            <Text style={[styles.historyExpression, { color: isDark ? "#aaa" : "#444444ff" }]} numberOfLines={1}>
                                {item.expression}
                            </Text>
                            <Text style={[styles.historyResult, { color: isDark ? "#fff" : "#000" }]} numberOfLines={1}>
                                = {item.result}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={[
                        styles.displayText,
                        { color: isError ? "red" : isDark ? "#fff" : "#000" }
                    ]}>
                        {displayValue}
                    </Text>
                </ScrollView>
            </View>

            <View style={styles.buttonsContainer}>
                {buttonLayout.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map(btn => (
                            <CalculatorButton
                                key={btn.label}
                                label={btn.label}
                                type={btn.type}
                                onPress={handlePress}
                                getButtonStyle={getButtonStyle}
                                getButtonTextStyle={getButtonTextStyle}
                                customStyle={btn.style}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};

export default Calculator;

const styles = StyleSheet.create({
    container: { flex: 1 },
    displayContainer: { flex: 1, justifyContent: "flex-end", padding: 16 },
    displayText: { fontSize: 48, fontWeight: "600" },
    historyContainer: { maxHeight: 100 },
    historyItem: { flexDirection: "row", justifyContent: "space-between" },
    historyExpression: { fontSize: 16 },
    historyResult: { fontSize: 18, fontWeight: "500" },
    buttonsContainer: { padding: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    button: {
        flex: 1,
        margin: 4,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        height:80,
    },
    buttonSmall: { height: 50 },
    buttonTablet: { height: 80 },
    buttonText: { fontSize: 22, fontWeight: "600" },
});