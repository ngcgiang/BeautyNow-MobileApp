import React from 'react';
import Colors from '../constants/Colors';

type Theme = 'light' | 'dark';

function useColorScheme(): Theme {
  // Đơn giản: luôn light, có thể dùng context hoặc media query cho thực tế
  return 'light';
}

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

type TextProps = ThemeProps & React.HTMLAttributes<HTMLSpanElement>;
type ViewProps = ThemeProps & React.HTMLAttributes<HTMLDivElement>;

function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];
  return colorFromProps || Colors[theme][colorName];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <span style={{ color, ...(style || {}) }} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <div style={{ backgroundColor, ...(style || {}) }} {...otherProps} />;
} 