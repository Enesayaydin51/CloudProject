import { StyleSheet, Text, View, TextInput } from 'react-native';
import React from 'react';

const CustomTextInput = ({
  title,
  isSecureText,
  handleonChangeText,
  handleValue,
  handlePlaceholder,
}) => {
  return (
    <View style={styles.InputContainer}>
      <Text style={styles.InputBoxText}>{title}</Text>

      <TextInput
        secureTextEntry={isSecureText}
        placeholder={handlePlaceholder}
        placeholderTextColor="rgba(255,255,255,0.35)" 
        onChangeText={handleonChangeText}
        value={handleValue}
        style={styles.TextInputStyle}
        selectionColor="#D6B982" 
      />
    </View>
  );
};

export default CustomTextInput;

const styles = StyleSheet.create({
  InputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  InputBoxText: {
    color: '#D6B982',        // ✨ Label artık gold
    fontWeight: '500',
    fontSize: 14,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  TextInputStyle: {
    color: '#fff',
    borderBottomWidth: 1.3,
    borderBottomColor: 'rgba(214,185,130,0.4)', // ✨ Premium çizgi
    height: 42,
    paddingHorizontal: 10,
    textAlign: 'left',
    fontSize: 15,
  },
});
