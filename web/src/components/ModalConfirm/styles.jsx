import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
`;

const Title = styled.h3`
  margin: 0 0 10px;
  color: #1b6f6a;
`;

const Message = styled.p`
  margin: 0 0 20px;
  color: #555;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const CancelButton = styled.button`
  border: none;
  background: #e8f3f2;
  color: #1b6f6a;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
`;

const ConfirmButton = styled.button`
  border: none;
  background: #c0392b;
  color: #ffffff;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
`;
