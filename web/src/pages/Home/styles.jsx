import styled from 'styled-components';

export const SectionBar = styled.div`
  margin-bottom: 28px;
`;

export const ResetButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
  background: #e8f3f2;
  color: #1b6f6a;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #d6ebe9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;
