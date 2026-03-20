function machinesReducer(state, action) {
  switch (action.type) {
    case 'SET_MACHINES': {
      return action.payload;
    }

    case 'ADD_MACHINE': {
      return [...state, action.payload];
    }

    case 'REPLACE_MACHINE': {
      return state.map((machine) =>
        machine.id === action.payload.id ? action.payload : machine,
      );
    }

    case 'CLEAR_ALL': {
      return [];
    }

    case 'DELETE_MACHINE': {
      return state.filter((machine) => machine.id !== action.payload);
    }

    default:
      return state;
  }
}

export default machinesReducer;
