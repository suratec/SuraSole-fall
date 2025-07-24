import React, { Component } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Image,
} from 'react-native';
import { connect } from 'react-redux';
import { getLocalizedText } from '../../assets/language/langUtils';

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
        return flagMap[langKey] || '🌐';
    };

    getLanguageOptions = () => {
        const { langSwitch } = this.props;

        // Debug logging
        console.log('LanguagePickerFix - langSwitch:', langSwitch);

        // Provide default options if langSwitch is missing
        if (!langSwitch || Object.keys(langSwitch).length === 0) {
            console.log('Using default language options');
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
            isCircular = false,  // NEW PROP
            showFlag = false,    // NEW PROP
            showText = true      // NEW PROP
        } = this.props;

        const { langPickerVisible } = this.state;
        const languageOptions = this.getLanguageOptions();

        // Debug logging
        console.log('LanguagePickerFix render - languageOptions:', languageOptions);
        console.log('LanguagePickerFix render - isCircular:', isCircular);
        console.log('LanguagePickerFix render - showFlag:', showFlag);

        // Remove the early return that was causing the issue
        // if (languageOptions.length === 0) {
        //     return null;
        // }

        // Dynamic button style based on isCircular prop
        const dynamicButtonStyle = isCircular
            ? styles.circularButton  // No additional buttonStyle for circular
            : [styles.languageButton, buttonStyle];

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
                                {this.getCurrentLanguageFlag()}
                            </Text>
                        )}

                        {/* Show text if requested and not circular-only mode */}
                        {showText && !isCircular && (
                            <Text style={[styles.languageButtonText, textStyle]}>
                                {showFlag ? `${this.getCurrentLanguageText()}` : this.getCurrentLanguageText()} ▼
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

    // Button Content Layout - Simple and clean
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },

    // Original Rectangular Button
    languageButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e0f7fa',
        borderWidth: 1,
        borderColor: '#00c3cc',
        flexDirection: 'row',
        alignItems: 'center',
    },

    // NEW: Circular Button Style - Completely clean like logout
    circularButton: {
        width: 30,                       // Match logout image size
        height: 30,
        borderRadius: 15,                // Half of width/height
        backgroundColor: 'transparent',   // Transparent like logout
        borderWidth: 0,                  // No border (parent handles it)
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        // Remove ALL styling that could cause artifacts
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
    },
    languageButtonTextWithFlag: {
        marginLeft: 5, // Add spacing between flag and text
    },

    // Flag Text Style - Clean and simple
    flagText: {
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: 'transparent',
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
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00c3cc',
        textAlign: 'center',
        marginBottom: 15,
    },

    // Language Option Styles (enhanced with flags)
    languageOption: {
        paddingVertical: 12,
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
    },
    languageOptionFlag: {
        fontSize: 20,
        marginRight: 10,
    },
    languageOptionText: {
        fontSize: 18,
        fontWeight: 'normal',
        color: '#00c3cc',
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