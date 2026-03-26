import { FiltersContainer, FilterButton } from './styles';

function Filters({ statusFilter, setStatusFilter }) {
  return (
    <FiltersContainer>
      <FilterButton
        $active={statusFilter === 'all'}
        onClick={() => setStatusFilter('all')}
      >
        Todas
      </FilterButton>

      <FilterButton
        $active={statusFilter === 'running'}
        onClick={() => setStatusFilter('running')}
      >
        Rodando
      </FilterButton>

      <FilterButton
        $active={statusFilter === 'stopped'}
        onClick={() => setStatusFilter('stopped')}
      >
        Paradas
      </FilterButton>

      <FilterButton
        $active={statusFilter === 'late'}
        onClick={() => setStatusFilter('late')}
      >
        Atrasadas
      </FilterButton>
    </FiltersContainer>
  );
}

export default Filters;
