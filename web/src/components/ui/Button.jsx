import styled from 'styled-components';

export const Button = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;

  background: #1b6f6a;
  color: #ffffff;

  transition:
    background 0.2s ease,
    transform 0.05s ease;

  &:hover {
    background: #155a55;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: #9bbdbb;
    cursor: not-allowed;
  }
`;
