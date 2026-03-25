import { FieldGroup, Label, ErrorText } from './styles';

function FormField({ label, htmlFor, error, children }) {
  return (
    <FieldGroup>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </FieldGroup>
  );
}

export default FormField;
