import { createTheme, Button, TextInput, Select, NumberInput, PasswordInput, Textarea, Modal } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'coffee',
  primaryShade: 7,
  colors: { coffee: ['#fcf9f4', '#f6f1e6', '#ebe0cd', '#dcc6a8', '#c8a47e', '#b4865b', '#966a46', '#78523a', '#624433', '#50392f'] },
  fontFamily: "'MiSans VF', system-ui, sans-serif",
  headings: { fontFamily: "'MiSans VF', system-ui, sans-serif", fontWeight: '700' },
  defaultRadius: 'md',
  focusRing: 'auto',
  components: {
    Button: Button.extend({ defaultProps: { size: 'sm' } }),
    TextInput: TextInput.extend({ defaultProps: { size: 'md' } }),
    Select: Select.extend({ defaultProps: { size: 'md', nothingFoundMessage: '没有匹配的选项' } }),
    NumberInput: NumberInput.extend({ defaultProps: { size: 'md' } }),
    PasswordInput: PasswordInput.extend({ defaultProps: { size: 'md' } }),
    Textarea: Textarea.extend({ defaultProps: { size: 'md' } }),
    Modal: Modal.extend({ defaultProps: { centered: true, overlayProps: { backgroundOpacity: 0.4, blur: 3 }, radius: 'lg' } }),
  },
});
