import styled from 'styled-components';

export const FormCard = styled.div`
  background: #ffffff;
  border: 1px solid #d7e6e4;
  border-left: 6px solid #1b6f6a;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: min(800px, 92vw);
  box-sizing: border-box;
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
`;

export const Title = styled.h2`
  margin: 0 0 6px;
  color: #1b6f6a;
  font-size: 1.4rem;
`;

export const Subtitle = styled.p`
  margin: 0;
  color: #5f6b6a;
  font-size: 0.95rem;
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  color: #5f6b6a;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
`;

export const Actions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export const CancelButton = styled.button`
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
