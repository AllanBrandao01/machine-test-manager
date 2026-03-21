import styled from 'styled-components';

export const Select = styled.select`
  width: 100%;
  border: 1px solid #bfd5d2;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.95rem;
  background: #fff;
  color: #243534;
  outline: none;
  box-sizing: border-box;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    border-color: #2f8f88;
    box-shadow: 0 0 0 3px rgba(47, 143, 136, 0.12);
  }

  &:disabled {
    background: #f5f7f7;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
