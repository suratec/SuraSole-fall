import React, { Component } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
    Dimensions,
} from 'react-native';
import { connect } from 'react-redux';
import { getLocalizedText } from '../../assets/language/langUtils';

const { width: screenWidth } = Dimensions.get('window');

class LanguagePickerFix extends Component {
    state = {
        langPickerVisible: false,
    };

    // Language flag mappings
    getLanguageFlag = (langKey) => {
        const flagMap = {
            eng: '🇺🇸', // or use require('../../assets/image/flags/us.png')
            thai: '🇹🇭',
            japanese: '🇯🇵'
        };
        return flagMap[langKey] || '🇺🇸';
    };

    getLanguageOptions = () => {
        const { langSwitch } = this.props;

        if (!langSwitch || Object.keys(langSwitch).length === 0) {
            return [
                { label: 'English', value: 0, key: 'eng', flag: this.getLanguageFlag('eng') },
                { label: 'ไทย', value: 1, key: 'thai', flag: this.getLanguageFlag('thai') },
                { label: '日本語', value: 2, key: 'japanese', flag: this.getLanguageFlag('japanese') }
            ];
        }

        const langKeys = Object.keys(langSwitch);
        return langKeys.map((key, index) => ({
            label: langSwitch[key],
            value: index,
            key: key,
            flag: this.getLanguageFlag(key)
        }));
    };

    // Get current language display text dynamically
    getCurrentLanguageText = () => {
        const { lang, langSwitch } = this.props;

        // Use default text if langSwitch is missing
        if (!langSwitch || Object.keys(langSwitch).length === 0) {
            const defaultTexts = ['English', 'ไทย', '日本語'];
            return defaultTexts[lang] || defaultTexts[0];
        }

        const langKeys = Object.keys(langSwitch);
        const currentLangKey = langKeys[lang];
        return langSwitch[currentLangKey] || langSwitch[langKeys[0]];
    };

    // Get current language flag
    getCurrentLanguageFlag = () => {
        const { lang, langSwitch } = this.props;

        // Use default flag mapping if langSwitch is missing
        if (!langSwitch || Object.keys(langSwitch).length === 0) {
            const defaultFlags = ['🇺🇸', '🇹🇭', '🇯🇵'];
            return defaultFlags[lang] || defaultFlags[0];
        }

        const langKeys = Object.keys(langSwitch);
        const currentLangKey = langKeys[lang];
        return this.getLanguageFlag(currentLangKey);
    };

    // Handle language selection
    selectLanguage = (langIndex) => {
        if (this.props.onLanguageChange) {
            this.props.onLanguageChange(langIndex);
        }

        this.props.edit_Lang(langIndex);
        this.setState({ langPickerVisible: false });
    };

    // Open modal
    openModal = () => {
        this.setState({ langPickerVisible: true });
    };

    // Close modal
    closeModal = () => {
        this.setState({ langPickerVisible: false });
    };

    render() {
        const {
            lang,
            style,
            buttonStyle,
            textStyle,
            modalTitle,
            isCircular = false,
            showFlag = false,
            showText = true
        } = this.props;

        const { langPickerVisible } = this.state;
        const languageOptions = this.getLanguageOptions();

        // Get current text to calculate button width
        const currentText = this.getCurrentLanguageText();
        const currentFlag = this.getCurrentLanguageFlag();

        // Dynamic button style based on isCircular prop
        const dynamicButtonStyle = isCircular
            ? styles.circularButton
            : [
                styles.languageButton,
                buttonStyle,
                // Auto-sizing: Remove fixed width, let flexShrink work
                {
                    alignSelf: 'flex-start', // Let button size itself
                    maxWidth: screenWidth * 0.8, // Prevent it from being too wide
                }
            ];

        return (
            <View style={[styles.container, style]} pointerEvents="box-none">
                {/* Language Trigger Button */}
                <TouchableOpacity
                    style={dynamicButtonStyle}
                    onPress={this.openModal}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <View style={styles.buttonContent} pointerEvents="none">
                        {/* Show flag if requested */}
                        {showFlag && (
                            <Text style={isCircular ? styles.flagTextCircular : styles.flagText}>
                                {currentFlag}
                            </Text>
                        )}

                        {/* Show text if requested and not circular-only mode */}
                        {showText && !isCircular && (
                            <Text
                                style={[
                                    styles.languageButtonText,
                                    textStyle,
                                    showFlag && styles.languageButtonTextWithFlag
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {currentText} ▼
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Language Selection Modal */}
                <Modal
                    visible={langPickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={this.closeModal}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={this.closeModal}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Title */}
                            <Text style={styles.modalTitle}>
                                {modalTitle || getLocalizedText(lang, {
                                    eng: 'Select Language',
                                    thai: 'เลือกภาษา',
                                    japanese: '言語を選択'
                                })}
                            </Text>

                            {/* Language Options */}
                            {languageOptions.map(option => (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => this.selectLanguage(option.value)}
                                    style={[
                                        styles.languageOption,
                                        lang === option.value && styles.languageOptionSelected
                                    ]}
                                >
                                    <View style={styles.languageOptionContent}>
                                        {/* Only show flag in modal if showFlag is true */}
                                        {showFlag && (
                                            <Text style={styles.languageOptionFlag}>
                                                {option.flag}
                                            </Text>
                                        )}
                                        <Text style={[
                                            styles.languageOptionText,
                                            lang === option.value && styles.languageOptionTextSelected,
                                            !showFlag && styles.languageOptionTextCentered
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}

                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={this.closeModal}
                                style={styles.modalCloseButton}
                            >
                                <Text style={styles.modalCloseText}>
                                    {getLocalizedText(lang, {
                                        eng: 'Close',
                                        thai: 'ปิด',
                                        japanese: '閉じる'
                                    })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        zIndex: 1000,
    },

    // Button Content Layout - Flexible sizing
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1, // Allow content to shrink if needed
        minWidth: 0,   // Allow text to wrap/ellipsize
    },

    // Updated Rectangular Button - Auto-sizing
    languageButton: {
        paddingVertical: 10,
        paddingHorizontal: 16, // Horizontal padding for breathing room
        borderRadius: 8,
        backgroundColor: '#e0f7fa',
        borderWidth: 1,
        borderColor: '#00c3cc',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // Remove fixed width - let content determine size
        minWidth: 80, // Minimum width for small text
        flexShrink: 0, // Don't shrink the button itself
    },

    // Circular Button Style - unchanged
    circularButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'transparent',
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        overflow: 'visible',
    },

    languageButtonText: {
        fontSize: 16,
        color: '#00c3cc',
        fontWeight: 'bold',
        textAlign: 'center',
        flexShrink: 1, // Allow text to shrink if needed
    },
    languageButtonTextWithFlag: {
        marginLeft: 6, // Add spacing between flag and text
    },

    // Flag Text Style
    flagText: {
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'transparent',
        flexShrink: 0, // Don't shrink flags
    },
    flagTextCircular: {
        fontSize: 20,
        textAlign: 'center',
        backgroundColor: 'transparent',
        includeFontPadding: false,
    },

    // Modal Styles (unchanged)
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        width: 250,
        maxWidth: screenWidth * 0.9,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00c3cc',
        textAlign: 'center',
        marginBottom: 15,
    },

    // Language Option Styles
    languageOption: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginVertical: 2,
        backgroundColor: '#fff',
    },
    languageOptionSelected: {
        backgroundColor: '#00c3cc',
    },
    languageOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 1,
    },
    languageOptionFlag: {
        fontSize: 20,
        marginRight: 10,
        flexShrink: 0,
    },
    languageOptionText: {
        fontSize: 18,
        fontWeight: 'normal',
        color: '#00c3cc',
        flexShrink: 1,
        textAlign: 'center',
    },
    languageOptionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    languageOptionTextCentered: {
        textAlign: 'center',
        width: '100%',
    },

    // Close Button Styles
    modalCloseButton: {
        marginTop: 10,
    },
    modalCloseText: {
        color: '#00c3cc',
        textAlign: 'center',
        fontSize: 16,
    },
});

// Redux connection
const mapStateToProps = state => ({
    lang: state.lang,
});

const mapDispatchToProps = dispatch => ({
    edit_Lang: data => dispatch({ type: 'EDIT_LANG', payload: data }),
});

export default connect(mapStateToProps, mapDispatchToProps)(LanguagePickerFix);