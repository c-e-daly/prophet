import  createClient  from "../../../../supabase/server";
import type { Inserts, Tables, Enum } from "../../types/dbTables";

const supabase = createClient();