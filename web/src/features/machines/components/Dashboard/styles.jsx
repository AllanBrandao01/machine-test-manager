import styled, { css } from 'styled-components';

export const DashboardSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

export const SummaryCard = styled.div`
  background: #ffffff;
  border: 1px solid #d7e6e4;
  border-left: 6px solid #1b6f6a;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 6px 18px rgba(27, 111, 106, 0.08);

  ${({ $variant }) =>
    $variant === 'running' &&
    css`
      border-left-color: #1b6f6a;
      background: #ffffff;
    `}

  ${({ $variant }) =>
    $variant === 'stopped' &&
    css`
      border-left-color: #c0392b;
      background: #fff6f5;
    `}

  ${({ $variant }) =>
    $variant === 'late' &&
    css`
      border-left-color: #d18b16;
      background: #fff9ef;
    `}

  ${({ $variant }) =>
    $variant === 'done' &&
    css`
      border-left-color: #2f8f88;
      background: #f3fbfa;
    `}
`;

export const SummaryLabel = styled.span`
  display: block;
  color: #5f6b6a;
  font-size: 0.9rem;
  margin-bottom: 8px;
`;

export const SummaryValue = styled.strong`
  font-size: 1.8rem;
  line-height: 1;

  ${({ $variant }) =>
    $variant === 'running' &&
    css`
      color: #1b6f6a;
    `}

  ${({ $variant }) =>
    $variant === 'stopped' &&
    css`
      color: #c0392b;
    `}

  ${({ $variant }) =>
    $variant === 'late' &&
    css`
      color: #b7791f;
    `}

  ${({ $variant }) =>
    $variant === 'done' &&
    css`
      color: #2f8f88;
    `}
`;
