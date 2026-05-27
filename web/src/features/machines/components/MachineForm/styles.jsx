import styled from 'styled-components';

export const FormCard = styled.div`
  background: #ffffff;
  border: 1px solid #d7e6e4;
  border-left: 6px solid #1b6f6a;
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 6px 18px rgba(27, 111, 106, 0.08);
  max-width: 800px;
`;

export const Header = styled.div`
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

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
`;

export const Actions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-start;
`;
