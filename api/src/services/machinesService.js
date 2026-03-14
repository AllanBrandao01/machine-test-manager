import { supabase } from '../lib/supabase.js';

export async function findAllMachines() {
  const { data, error } = await supabase.from('machines').select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
