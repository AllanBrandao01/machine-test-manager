import styled from 'styled-components';

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const FilterButton = styled.button`
  border: 1px solid #d7e6e4;
  background: #ffffff;
  color: #244240;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  transition: all 0.2s ease;

  ${({ $active }) =>
    $active &&
    `
      background: #1b6f6a;
      color: #ffffff;
      border-color: #1b6f6a;
    `}

  &:hover {
    background: #e8f3f2;
  }
`;
