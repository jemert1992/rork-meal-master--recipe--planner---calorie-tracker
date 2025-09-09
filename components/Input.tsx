import React, { memo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '@/constants/colors';

export type InputProps = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  error?: string;
  helperText?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  testID?: string;
};

function InputCmp({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', error, helperText, style, inputStyle, testID }: InputProps) {
  const [focused, setFocused] = useState<boolean>(false);
  return (
    <View style={[styles.container, style]} testID={testID}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, focused && styles.inputFocused, error && styles.inputError, inputStyle]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor={Colors.textLight}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const Input = memo(InputCmp);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  helper: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
  },
  error: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
});