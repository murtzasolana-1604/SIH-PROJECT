/**
 * Reusable Input Component
 */

import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { THEME } from "../../constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  containerStyle,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={THEME.colors.textMuted}
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.xs,
  },
  label: {
    fontSize: THEME.typography.sizes.subtext,
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    marginBottom: THEME.spacing.xs,
  },
  input: {
    height: 48,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: THEME.typography.sizes.body,
    color: THEME.colors.text,
  },
  inputError: {
    borderColor: THEME.colors.danger,
  },
  errorText: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.danger,
    marginTop: THEME.spacing.xs,
  },
  helperText: {
    fontSize: THEME.typography.sizes.caption,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
  },
});
