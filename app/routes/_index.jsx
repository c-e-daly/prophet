import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createClient } from "~/utils/supabase.server";

export async function loader({ request }) {
  const supabase = createClient(request);
  const { data: todos } = await supabase.from('todos').select();

  return { todos };
}

export default function Index() {
  const { todos } = useLoaderData();

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
