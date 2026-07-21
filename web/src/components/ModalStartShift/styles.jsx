import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContainer = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
`;

export const Title = styled.h3`
  margin: 0 0 20px;
  color: #1b6f6a;
`;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

export const CancelButton = styled.button`
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ConfirmButton = styled.button`
  border: none;
  background: #1b6f6a;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const WarningBox = styled.div`
  background: #fdf3e3;
  border: 1px solid #f0c987;
  color: #8a5a10;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 20px;
`;
