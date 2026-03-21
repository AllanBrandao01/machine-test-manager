import styled from 'styled-components';

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Label = styled.label`
  font-weight: 600;
  color: #244240;
  font-size: 0.95rem;
`;

const ErrorText = styled.span`
  color: #c0392b;
  font-size: 0.85rem;
  font-weight: 600;
`;

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
