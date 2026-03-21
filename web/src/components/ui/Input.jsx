import styled from 'styled-components';

export const Input = styled.input`
  width: 100%;
  box-sizing: border-box;

  border: 1px solid #d7e6e4;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.9rem;

  background: #fff;
  color: #244240;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1b6f6a;
    box-shadow: 0 0 0 2px rgba(27, 111, 106, 0.1);
  }

  &:disabled {
    background: #f5f7f7;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;
